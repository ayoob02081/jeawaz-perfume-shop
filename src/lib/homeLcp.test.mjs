// Home LCP: the first primary banner is in the server HTML as the one image the
// browser picks for its viewport (no CSS-hidden twin), marked eager and
// fetchpriority=high; later slides stay lazy; images that are not the LCP do not
// take React's automatic preloads. Real next/image, Swiper and React Query.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { artDirectedImageSources } from "../utils/appImageSource.mjs";
import { STOREFRONT_CATALOG_STALE_TIME, bannerInitialQueryOptions, catalogInitialView } from "./storefrontCatalog.mjs";
import { fetchCatalogSnapshot } from "./storefrontCatalog.server.mjs";
import { HOME_CATALOG_QUERY } from "./storefrontCatalog.mjs";
import { normalizeProductsQuery } from "../utils/productFilterContract.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { createElement: h } = require("react");
const { renderToString } = require("react-dom/server");
const SRC = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(SRC + path, "utf8");

let activeBanners = async () => { throw new Error("no client read during server render"); };
const stubs = {
  "@/contexts/auth/AuthContext": { useAuth: () => ({ user: null }) },
  "next/link": ({ href, children, prefetch, ...rest }) => h("a", { href, ...rest }, children),
  "@/services/bannerServices": { getActiveBannersApi: (params) => activeBanners(params) },
  "@/utils/showApiError": { showApiError() {} },
  "next/navigation": { useRouter: () => ({ push() {}, refresh() {} }) },
  "react-hot-toast": { default: { success() {} } },
  "swiper/css": {},
  "swiper/css/pagination": {},
};
const modules = new Map();
function file(base) {
  for (const candidate of [base, `${base}.jsx`, `${base}.js`, `${base}.mjs`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return resolve(candidate);
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
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
    module: { type: "commonjs" },
  });
  const local = (name) => Object.hasOwn(stubs, name) ? stubs[name]
    : name.startsWith("@/") ? load(file(SRC + name.slice(2)))
      : name.startsWith(".") ? load(file(resolve(dirname(path), name)))
        : require(name);
  new Function("require", "module", "exports", "process", code)(local, module, module.exports, process);
  return module.exports;
}
const component = (path) => load(file(SRC + path)).default;
const BannerPicture = component("components/BannerPicture");
const PrimaryBannerLayout = component("app/(user)/_components/PrimaryBannerLayout");

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const banner = (id, mobile = `/uploads/m${id}.webp`) =>
  ({ id, type: "primary", title: `بنر ${id}`, link: "/products", imageUrl: `/uploads/d${id}.webp`, mobileImageUrl: mobile });
const pictures = (html) => [...html.matchAll(/<picture>([\s\S]*?)<\/picture>/g)].map(([, inner]) => inner);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
const imgTag = (inner) => inner.match(/<img [^>]*>/)[0];
const sourceTag = (inner) => inner.match(/<source [^>]*>/)?.[0];

function renderHome(snapshot) {
  // The loaded components require() React Query: render with that same instance.
  const { QueryClient: Client, QueryClientProvider: Provider } = require("@tanstack/react-query");
  const client = new Client({ defaultOptions: { queries: { retry: false } } });
  return renderToString(h(Provider, { client }, h(PrimaryBannerLayout, { initialSnapshot: snapshot })));
}

test("the first primary banner is server HTML: one <picture>, eager, fetchpriority=high, no preload", () => {
  const html = renderHome({ data: [banner(1), banner(2), banner(3)], updatedAt: Date.now() });
  assert.doesNotMatch(html, /animate-pulse|skeleton/i, "content, not the skeleton");
  const found = pictures(html);
  assert.equal(found.length, 3, "one picture per slide");
  const [first, ...rest] = found;
  assert.equal(attr(sourceTag(first), "media"), "(min-width: 30rem)");
  assert.equal(attr(sourceTag(first), "srcSet"), `${API}/uploads/d1.webp`);
  const img = imgTag(first);
  assert.equal(attr(img, "src"), `${API}/uploads/m1.webp`);
  assert.equal(attr(img, "loading"), "eager");
  assert.equal(attr(img, "fetchPriority"), "high");
  assert.equal(attr(img, "alt"), "بنر 1");
  assert.match(attr(img, "class"), /object-cover/);
  assert.match(attr(img, "style"), /position:absolute;height:100%;width:100%/);
  for (const later of rest) {
    assert.equal(attr(imgTag(later), "loading"), "lazy", "later slides are not eager");
    assert.equal(attr(imgTag(later), "fetchPriority"), undefined);
  }
  // A preload cannot carry the <source> media; React adds none inside <picture>.
  assert.doesNotMatch(html, /rel="preload"/);
  // The slide images keep the card box and the existing swiper container.
  assert.match(html, /class="relative size-full aspect-square overflow-hidden"/);
  assert.match(html, /primary-banner-swiper/);
});

test("React's automatic preload is what <picture> avoids for a CSS-hidden twin", () => {
  const plain = renderToString(h("div", null, h("img", { src: "/uploads/x.webp", alt: "" })));
  assert.match(plain, /<link rel="preload" as="image" href="\/uploads\/x.webp"\/>/);
  const lazy = renderToString(h("img", { src: "/images/flower.svg", alt: "", loading: "lazy", fetchPriority: "low" }));
  assert.doesNotMatch(lazy, /rel="preload"/);
});

test("without a server snapshot the banner keeps its skeleton and client read", () => {
  const html = renderHome(undefined);
  assert.equal(pictures(html).length, 0);
  assert.doesNotMatch(html, /<img /);
});

test("no mobile art: both viewports use the desktop image; unloadable art leaves only the box", () => {
  const same = renderToString(h(BannerPicture, { src: "/uploads/d.webp", mobileSrc: "/uploads/d.webp", alt: "a", priority: true }));
  assert.equal(attr(sourceTag(pictures(same)[0]), "srcSet"), attr(imgTag(pictures(same)[0]), "src"));

  const none = renderToString(h(BannerPicture, { src: "null", mobileSrc: " ", alt: "a" }));
  assert.equal(pictures(none).length, 0);
  assert.deepEqual([...none.matchAll(/<span role="img" aria-label="a" class="([^"]+)"/g)].map(([, c]) => c),
    ["absolute inset-0 max-[30rem]:hidden", "absolute inset-0 min-[30rem]:hidden"]);

  // Mobile art unloadable: desktop image only from 30rem; the mobile box is labelled.
  const desktopOnly = renderToString(h(BannerPicture, { src: "/uploads/d.webp", mobileSrc: "undefined", alt: "a" }));
  const only = pictures(desktopOnly)[0];
  assert.equal(sourceTag(only), undefined);
  assert.equal(attr(imgTag(only), "src"), `${API}/uploads/d.webp`);
  assert.match(attr(imgTag(only), "class"), /max-\[30rem\]:hidden/);
  assert.match(desktopOnly, /<span role="img" aria-label="a" class="absolute inset-0 min-\[30rem\]:hidden"/);
});

test("art-directed sources follow AppImage resolution and never retry a failed URL", () => {
  assert.deepEqual(artDirectedImageSources("/uploads/d.webp", "/uploads/m.webp", "https://api"),
    { desktop: "https://api/uploads/d.webp", mobile: "https://api/uploads/m.webp" });
  assert.deepEqual(artDirectedImageSources("https://cdn/x.webp", "/images/y.webp", "https://api"),
    { desktop: "https://cdn/x.webp", mobile: "/images/y.webp" });
  assert.deepEqual(artDirectedImageSources(undefined, "null", "https://api"), { desktop: null, mobile: null });
  assert.deepEqual(artDirectedImageSources("/uploads/d.webp", "/uploads/m.webp", "https://api", new Set(["https://api/uploads/m.webp"])),
    { desktop: "https://api/uploads/d.webp", mobile: null });
});

test("the home snapshot adds one parallel anonymous no-store primary-banner read", async () => {
  const calls = [];
  let finish;
  const gate = new Promise((done) => { finish = done; });
  const pending = fetchCatalogSnapshot({ apiUrl: "https://api.example.test", query: HOME_CATALOG_QUERY,
    includeCategories: true, includePrimaryBanners: true, fetchImpl: async (url, options) => {
      calls.push({ url, options });
      await gate;
      const body = url.pathname === "/products"
        ? { data: [], meta: { ...normalizeProductsQuery(HOME_CATALOG_QUERY), total: 0, totalPages: 0 } }
        : url.pathname === "/banners/active" ? [banner(1)] : [];
      return { ok: true, json: async () => body };
    } });
  assert.equal(calls.length, 4, "all reads start before any completes");
  finish();
  const snapshot = await pending;
  const bannerCall = calls.find(({ url }) => url.pathname === "/banners/active");
  assert.equal(bannerCall.url.search, "?type=primary");
  assert.equal(bannerCall.options.cache, "no-store");
  assert.equal(bannerCall.options.credentials, "omit");
  assert.deepEqual(snapshot.primaryBanners.data, [banner(1)]);
  assert(Number.isFinite(snapshot.primaryBanners.updatedAt));
});

test("a failed or malformed banner read seeds nothing; other routes make no banner read", async (t) => {
  t.mock.method(console, "warn", () => {});
  for (const body of [{ data: [] }, [null], "nope"]) {
    const snapshot = await fetchCatalogSnapshot({ apiUrl: "https://api.example.test", query: {}, includePrimaryBanners: true,
      fetchImpl: async (url) => url.pathname === "/banners/active" ? { ok: true, json: async () => body } : { ok: false } });
    assert.equal(snapshot.primaryBanners, undefined);
  }
  const failed = await fetchCatalogSnapshot({ apiUrl: "https://api.example.test", query: {}, includePrimaryBanners: true,
    fetchImpl: async () => ({ ok: false, status: 503 }) });
  assert.deepEqual(failed, {});
  const paths = [];
  await fetchCatalogSnapshot({ apiUrl: "https://api.example.test", query: {}, includeCategories: true,
    fetchImpl: async (url) => { paths.push(url.pathname); return { ok: false }; } });
  assert(!paths.includes("/banners/active"));
});

test("a banner snapshot hydrates without a repeated read; without one the client reads as before", async () => {
  assert.deepEqual(bannerInitialQueryOptions(undefined), {});
  const snapshot = { data: [banner(1)], updatedAt: Date.now() };
  const options = bannerInitialQueryOptions(snapshot);
  assert.deepEqual(options, { staleTime: STOREFRONT_CATALOG_STALE_TIME, initialData: snapshot.data, initialDataUpdatedAt: snapshot.updatedAt });

  let calls = 0;
  const client = new QueryClient();
  const observer = new QueryObserver(client, { queryKey: ["banners", "active", { type: "primary" }],
    queryFn: async () => { calls++; return [banner(2)]; }, ...options });
  const off = observer.subscribe(() => {});
  try {
    await new Promise(setImmediate);
    assert.equal(calls, 0, "mount does not repeat the server read");
    const view = catalogInitialView(observer.getCurrentResult(), options, false);
    assert.equal(view.data[0].id, 1);
    assert.equal(view.isPending, false);
    assert.equal(view.error, null);
  } finally { off(); client.clear(); }
});

test("wiring: home seeds the banner, deprioritizes decoration and below-the-fold card images", () => {
  const page = read("app/(user)/page.jsx");
  assert.match(page, /includePrimaryBanners: true/);
  assert.match(page, /<PrimaryBannerLayout initialSnapshot=\{snapshot\.primaryBanners\} \/>/);
  const flowers = [...page.matchAll(/<img\s[^>]*src="\/images\/flower\.svg"[^>]*\/>/g)].map(([tag]) => tag);
  assert.equal(flowers.length, 3);
  for (const tag of flowers) {
    assert.match(tag, /loading="lazy"/);
    assert.match(tag, /fetchPriority="low"/);
  }
  assert.match(read("app/(user)/_components/PrimaryBannerLayout.jsx"), /<PrimaryBannerCard banner=\{banner\} priority=\{index === 0\} \/>/);
  assert.match(read("components/PrimaryBannerCard.jsx"), /<BannerPicture[\s\S]*mobileSrc=\{mobileImageUrl \|\| imageUrl\}[\s\S]*priority=\{priority\}/);
  // A preload link cannot follow <source media>: BannerPicture never asks for one.
  assert.doesNotMatch(read("components/BannerPicture.jsx"), /\bpreload\b\s*[:=]|\bpriority:\s*true/);

  const card = read("app/(user)/_components/ProductCard.jsx");
  assert.match(card, /function ProductCard\(\{ product, isPending, error, imagePriority = true \}\)/);
  assert.equal(card.match(/priority=\{imagePriority\}/g).length, 2);
  for (const name of ["RecentProducts", "PopularProducts", "CampaignsProducts"]) {
    const source = read(`app/(user)/_components/${name}.jsx`);
    assert.match(source, /<ProductCard[^>]*imagePriority=\{false\}/s, name);
  }
  // Listing and related products keep the existing preloaded card images.
  for (const path of ["app/(user)/products/_components/ProductsLayout.jsx", "app/(user)/products/_components/RelatedProductsSection.jsx"]) {
    assert.doesNotMatch(read(path), /imagePriority/, path);
  }
});
