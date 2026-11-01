// Responsive upload variants: the srcset contract, AppImage's one-time original
// fallback, and the server HTML of AppImage, BannerPicture and ProductCard
// (real next/image getImageProps and React server rendering).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VARIANT_NAMESPACE,
  VARIANT_WIDTHS,
  rasterUploadName,
  uploadVariantSrcSet,
} from "./imageVariants.mjs";
import {
  initialImageState,
  nextImageStateAfterError,
} from "./appImageSource.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { createElement: h } = require("react");
const { renderToString } = require("react-dom/server");
const SRC = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(SRC + path, "utf8");
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const BASE = "https://api.example.test";

const stubs = {
  "next/link": ({ href, children, prefetch, ...rest }) =>
    h("a", { href, ...rest }, children),
};
const modules = new Map();
function file(base) {
  for (const candidate of [base, `${base}.jsx`, `${base}.js`, `${base}.mjs`]) {
    if (existsSync(candidate) && statSync(candidate).isFile())
      return resolve(candidate);
  }
  throw new Error(`Cannot resolve ${base}`);
}
function load(path) {
  if (path.endsWith(".mjs")) return require(path);
  if (modules.has(path)) return modules.get(path).exports;
  const module = { exports: {} };
  modules.set(path, module);
  const { code } = transformSync(readFileSync(path, "utf8"), {
    filename: path,
    jsc: {
      parser: { syntax: "ecmascript", jsx: true },
      transform: { react: { runtime: "automatic" } },
    },
    module: { type: "commonjs" },
  });
  const local = (name) =>
    Object.hasOwn(stubs, name)
      ? stubs[name]
      : name.startsWith("@/")
        ? load(file(SRC + name.slice(2)))
        : name.startsWith(".")
          ? load(file(resolve(dirname(path), name)))
          : require(name);
  new Function("require", "module", "exports", "process", code)(
    local,
    module,
    module.exports,
    process,
  );
  return module.exports;
}
const component = (path) => load(file(SRC + path)).default;
const AppImage = component("components/AppImage");
const BannerPicture = component("components/BannerPicture");
const ProductCard = component("app/(user)/_components/ProductCard");

const attr = (tag, name) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
const imgTags = (html) => html.match(/<img [^>]*>/g) ?? [];
const variants = (base, name) =>
  VARIANT_WIDTHS.map((w) => `${base}/uploads/w1/${w}/${name} ${w}w`).join(", ");

test("variant tiers and namespace mirror the backend", () => {
  assert.equal(VARIANT_NAMESPACE, "w1");
  assert.deepEqual(VARIANT_WIDTHS, [160, 320, 640, 960, 1280, 1920]);
});

test("only raster uploads on the API host get a srcset", () => {
  assert.equal(
    uploadVariantSrcSet(`${BASE}/uploads/a-1_b.webp`, BASE),
    variants(BASE, "a-1_b.webp"),
  );
  for (const name of ["x.png", "x.PNG", "x.jpg", "x.JPEG", "1780595724499-99219167.webp"]) {
    assert.equal(rasterUploadName(`${BASE}/uploads/${name}`, BASE), name);
  }
  for (const url of [
    `${BASE}/uploads/icon.svg`,
    `${BASE}/uploads/notes.txt`,
    `${BASE}/uploads/x.webp?v=1`,
    `${BASE}/uploads/w1/640/x.webp`,
    `${BASE}/uploads/../x.webp`,
    `${BASE}/uploads/..`,
    `${BASE}/uploads/.hidden.webp`,
    `${BASE}/uploads/a%2Fb.webp`,
    "https://cdn.example/uploads/x.webp",
    "/images/flower.webp",
    "/uploads/x.webp",
    null,
    undefined,
  ]) {
    assert.equal(uploadVariantSrcSet(url, BASE), null, String(url));
  }
});

test("AppImage falls back to the plain original once, then follows the existing fallback rules", () => {
  const start = initialImageState("/uploads/a.webp", "/uploads/b.webp", BASE);
  assert.deepEqual(start, {
    url: `${BASE}/uploads/a.webp`,
    srcSet: variants(BASE, "a.webp"),
  });
  const original = nextImageStateAfterError(start, "/uploads/b.webp", BASE);
  assert.deepEqual(original, { url: `${BASE}/uploads/a.webp`, srcSet: null });
  const fallback = nextImageStateAfterError(original, "/uploads/b.webp", BASE);
  assert.deepEqual(fallback, { url: `${BASE}/uploads/b.webp`, srcSet: null });
  assert.deepEqual(nextImageStateAfterError(fallback, "/uploads/b.webp", BASE), {
    url: null,
    srcSet: null,
  });

  // No variants: SVG, local assets, responsive={false}, missing sources.
  for (const [src, responsive] of [
    ["/uploads/icon.svg", true],
    ["/images/a.webp", true],
    ["/uploads/a.webp", false],
  ]) {
    assert.equal(initialImageState(src, null, BASE, responsive).srcSet, null);
  }
  assert.deepEqual(initialImageState("null", null, BASE), { url: null, srcSet: null });
  assert.deepEqual(
    nextImageStateAfterError(initialImageState("/uploads/icon.svg", null, BASE), null, BASE),
    { url: null, srcSet: null },
  );
});

test("AppImage server HTML: one lazy <img> with the variant srcset, sizes and the original as src", () => {
  const html = renderToString(
    h(AppImage, { src: "/uploads/p.webp", alt: "عطر", sizes: "64px" }),
  );
  const [img, ...others] = imgTags(html);
  assert.equal(others.length, 0, "no duplicate image");
  assert.equal(attr(img, "srcSet"), variants(API, "p.webp"));
  assert.equal(attr(img, "sizes"), "64px");
  assert.equal(attr(img, "src"), `${API}/uploads/p.webp`);
  assert.equal(attr(img, "alt"), "عطر");
  assert.equal(attr(img, "loading"), "lazy");
  assert.equal(attr(img, "fetchPriority"), undefined);
  assert.match(attr(img, "class"), /object-contain/);
  assert.match(attr(img, "style"), /position:absolute;height:100%;width:100%/);
  assert.match(html, /^<div class="relative w-full aspect-square overflow-hidden /);
  assert.doesNotMatch(html, /rel="preload"/);
  // srcset and sizes precede src, so a client-created image never fetches src first.
  assert.ok(img.indexOf("sizes=") < img.indexOf(" src="));
  assert.ok(img.indexOf("srcSet=") < img.indexOf(" src="));
});

test("a priority AppImage is eager and high priority; any preload follows the srcset", () => {
  const html = renderToString(
    h(AppImage, { src: "/uploads/p.webp", alt: "a", sizes: "50vw", priority: true }),
  );
  const [img] = imgTags(html);
  assert.equal(attr(img, "loading"), "eager");
  assert.equal(attr(img, "fetchPriority"), "high");
  for (const link of html.match(/<link [^>]*rel="preload"[^>]*>/g) ?? []) {
    // A preload of the bare original would download it in addition to the variant.
    assert.equal(attr(link, "imageSrcSet"), variants(API, "p.webp"));
    assert.equal(attr(link, "imageSizes"), "50vw");
  }
});

test("SVG, local and non-responsive sources keep the existing next/image output", () => {
  const svg = imgTags(
    renderToString(h(AppImage, { src: "/uploads/icon.svg", alt: "i", sizes: "10vw" })),
  )[0];
  assert.equal(attr(svg, "src"), `${API}/uploads/icon.svg`);
  assert.equal(attr(svg, "srcSet"), undefined);

  const zoom = imgTags(
    renderToString(
      h(AppImage, { src: "/uploads/p.webp", alt: "z", sizes: "100vw", responsive: false }),
    ),
  )[0];
  assert.equal(attr(zoom, "src"), `${API}/uploads/p.webp`);
  assert.equal(attr(zoom, "srcSet"), undefined);

  const empty = renderToString(h(AppImage, { src: "undefined", alt: "x" }));
  assert.equal(imgTags(empty).length, 0);
  assert.match(empty, /role="img" aria-label="x"/);
});

test("BannerPicture: desktop <source> and mobile <img> carry their own variant srcsets, no preload", () => {
  const html = renderToString(
    h(BannerPicture, {
      src: "/uploads/d.webp",
      mobileSrc: "/uploads/m.webp",
      alt: "بنر",
      sizes: "(min-width: 80rem) 1248px, calc(100vw - 16px)",
      mobileSizes: "calc(100vw - 16px)",
      priority: true,
    }),
  );
  const source = html.match(/<source [^>]*>/)[0];
  const [img, ...others] = imgTags(html);
  assert.equal(others.length, 0);
  assert.equal(attr(source, "media"), "(min-width: 30rem)");
  assert.equal(attr(source, "srcSet"), variants(API, "d.webp"));
  assert.equal(attr(source, "sizes"), "(min-width: 80rem) 1248px, calc(100vw - 16px)");
  assert.equal(attr(img, "srcSet"), variants(API, "m.webp"));
  assert.equal(attr(img, "sizes"), "calc(100vw - 16px)");
  assert.equal(attr(img, "src"), `${API}/uploads/m.webp`);
  assert.equal(attr(img, "loading"), "eager");
  assert.equal(attr(img, "fetchPriority"), "high");
  assert.doesNotMatch(html, /rel="preload"/);

  // An SVG banner keeps its plain URL.
  const svg = renderToString(
    h(BannerPicture, { src: "/uploads/d.svg", mobileSrc: "/uploads/d.svg", alt: "b" }),
  );
  assert.equal(attr(svg.match(/<source [^>]*>/)[0], "srcSet"), `${API}/uploads/d.svg`);
  assert.equal(attr(imgTags(svg)[0], "srcSet"), undefined);
});

const product = {
  id: 7,
  enTitle: "Fixture",
  perTitle: "آزمایشی",
  images: ["/uploads/p.webp"],
  brand: { value: "dior" },
  categories: {},
  variants: [{ id: 1, type: "decant", volume: 5, price: 100_000, isPurchasable: true, stock: 10 }],
  isAvailable: true,
};

test("ProductCard images are lazy by default; each twin's sizes collapses where it is hidden", () => {
  const lazy = imgTags(renderToString(h(ProductCard, { product })));
  assert.equal(lazy.length, 2, "mobile and desktop twins");
  const [mobile, desktop] = lazy;
  assert.equal(attr(mobile, "sizes"), "(min-width: 48rem) 1px, 64px");
  assert.equal(attr(desktop, "sizes"), "(min-width: 48rem) 160px, 1px");
  for (const img of lazy) {
    assert.equal(attr(img, "loading"), "lazy");
    assert.equal(attr(img, "fetchPriority"), undefined);
    assert.equal(attr(img, "srcSet"), variants(API, "p.webp"));
  }

  const eager = imgTags(
    renderToString(h(ProductCard, { product, imagePriority: true })),
  );
  for (const img of eager) {
    assert.equal(attr(img, "loading"), "eager");
    assert.equal(attr(img, "fetchPriority"), "high");
  }
});

test("wiring: only the first listing card is prioritized; related and home cards stay lazy", () => {
  assert.match(
    read("app/(user)/products/_components/ProductsLayout.jsx"),
    /<ProductCard\s+key=\{product\.id\}\s+product=\{product\}\s+imagePriority=\{index === 0\}\s*\/>/,
  );
  assert.match(
    read("app/(user)/products/_components/RelatedProductsSection.jsx"),
    /<ProductCard key=\{product\.id\} product=\{product\} \/>/,
  );
  for (const path of [
    "app/(user)/_components/PopularProducts.jsx",
    "app/(user)/_components/RecentProducts.jsx",
    "app/(user)/_components/CampaignsProducts.jsx",
  ]) {
    assert.match(read(path), /imagePriority=\{false\}/, path);
  }
  assert.match(
    read("app/(user)/_components/ProductCard.jsx"),
    /function ProductCard\(\{ product, isPending, error, imagePriority = false \}\)/,
  );
});

test("wiring: gallery prioritizes only the first slide, thumbnails stay lazy, zoom keeps the original", () => {
  const swiper = read("ui/ImageSwiper.jsx");
  assert.match(swiper, /priority=\{i === 0\}\s+objectFit="contain"\s+ratio=""\s+className="size-full"\s+sizes=\{SLIDE_SIZES\}/);
  assert.match(swiper, /alt=\{productThumbnailAlt\(product, i\)\}\s+objectFit="contain"\s+className="size-full"\s+sizes=\{THUMBNAIL_SIZES\}/);
  assert.doesNotMatch(swiper, /priority=\{i < 2\}/);
  assert.match(swiper, /sizes="100vw"\s+priority\s+responsive=\{false\}/);
});

test("wiring: banners, cart and order thumbnails declare their rendered widths", () => {
  assert.match(
    read("components/PrimaryBannerCard.jsx"),
    /sizes="\(min-width: 80rem\) 1248px, \(min-width: 64rem\) 992px, \(min-width: 48rem\) 736px, \(min-width: 40rem\) 608px, calc\(100vw - 16px\)"\s+mobileSizes="calc\(100vw - 16px\)"/,
  );
  assert.match(
    read("app/(user)/_components/SecondaryBannerLayout.jsx"),
    /sizes="\(min-width: 80rem\) 629px, \(min-width: 40rem\) 491px, 344px"/,
  );
  const cart = read("app/(user)/cart/_components/CartItemsLayout.jsx");
  assert.equal(cart.match(/sizes="64px"/g)?.length, 2);
  assert.equal(cart.match(/sizes="91px"/g)?.length, 2);
  assert.equal(cart.match(/sizes="96px"/g)?.length, 1);
  assert.doesNotMatch(cart, /sizes="[0-9]+vw"/);
  assert.match(read("app/(profile)/profile/orders/_components/OrderStatusPage.jsx"), /sizes="40px"/);
  assert.match(read("components/SingleOrderPage.jsx"), /width="max-lg:size-11 lg:size-9"\s+sizes="44px"/);
});
