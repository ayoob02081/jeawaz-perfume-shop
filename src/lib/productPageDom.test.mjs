// Server-rendered DOM of the real product detail tree and product card: the
// description is page content (not only metadata/JSON-LD/RSC data), the
// accordions keep their collapsed interaction, and image alt text is named
// from the product. Only I/O hooks, Next runtime pieces and unrelated leaf
// widgets are replaced; the production HTML is checked against a build too.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const SRC = fileURLToPath(new URL("../", import.meta.url));

const stubs = {
  "@/contexts/auth/AuthContext": { useAuth: () => ({ user: null }) },
  "next/navigation": { useRouter: () => ({ push() {}, refresh() {} }) },
  "@/hooks/useQuantityHandler": {
    useQuantityHandler: (product, initialVolume) => ({
      AddToCartHandler() {}, RemoveFromCartHandler() {}, selectedVolume: initialVolume,
      setSelectedVolume() {}, quantity: 0, isPending: false,
    }),
  },
  "@/hooks/useCart": { showAddToCartSuccessToast() {} },
  "./AddedToCartModal": () => null,
  "../../_components/skeleton/SingleProductSkeleton": () => null,
  "@/components/PriceSection": () => null,
  "@/components/CardEvents": () => null,
  "@/components/Loading": () => null,
  "embla-carousel-react": () => [() => {}, undefined],
  // next/image and next/link need the Next runtime; their output is checked in
  // the production HTML. Here they only expose what the page passes them.
  "@/components/AppImage": ({ src, alt }) => createElement("img", { src: src ?? "", alt }),
  "next/link": ({ href, children, prefetch, ...rest }) => createElement("a", { href, ...rest }, children),
};

const modules = new Map();
function file(base) {
  for (const candidate of [base, `${base}.jsx`, `${base}.js`, `${base}.mjs`]) {
    // One normalized path per file, so a module loads once however it is imported.
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
const SingleProductPage = component("app/(user)/products/_components/SingleProductPage");
const ProductCard = component("app/(user)/_components/ProductCard");
const Accordion = component("ui/Accordion");

const DESCRIPTION = "عطری مردانه، پودری و شیک با محور زنبق؛ اسطوخودوس در شروع و سدر در پایه.";
const product = {
  id: 9, perTitle: "دیور هوم اینتنس", enTitle: "Dior Homme Intense", grade: "ORIGINAL",
  concentration: "EAU_DE_PARFUM", description: DESCRIPTION,
  notesDescription: "آغاز آرام با اسطوخودوس.", notes: { top: ["اسطوخودوس"], middle: ["زنبق"], base: ["وتیور"] },
  brand: { id: 4, title: "دیور", value: "dior", iconUrl: "/uploads/dior.png" },
  images: ["/uploads/a.jpg", "/uploads/b.jpg"], categories: {}, stock: 100,
  variants: [{ id: 1, type: "decant", volume: 5, price: 100_000, isPurchasable: true }],
};
const render = (value) => renderToStaticMarkup(createElement(SingleProductPage, { product: value }));
const count = (html, text) => html.split(text).length - 1;
const alts = (html) => [...html.matchAll(/<img [^>]*alt="([^"]*)"/g)].map((match) => match[1]);
// Each description accordion: [container classes, button attributes, panel].
function accordions(html) {
  return [...html.matchAll(/<div class="([^"]*)"><button type="button" ([^>]*)><h4[^>]*>توضیحات تکمیلی<\/h4>[\s\S]*?<\/button>(<div id="[^"]*"[^>]*>[\s\S]*?<\/div>)?/g)]
    .map(([, classes, button, panel]) => ({ classes, button, panel }));
}

test("B1: the actual description is in the server-rendered DOM, inside both collapsed responsive accordions", () => {
  const html = render(product);
  assert.doesNotMatch(html, /<script/, "content DOM, not JSON-LD/RSC data");
  const found = accordions(html);
  // The two existing placements: mobile (end of page) and desktop (details column).
  assert.deepEqual(found.map(({ classes }) => /max-md:flex md:hidden/.test(classes) ? "mobile" : /max-md:hidden md:flex/.test(classes) ? "desktop" : "?").sort(), ["desktop", "mobile"]);
  assert.equal(count(html, DESCRIPTION), 2, "once per responsive placement, nowhere else");
  for (const { classes, button, panel } of found) {
    // Collapsed by default, exactly as before: container still centered/closed.
    assert.match(classes, /items-center justify-center/);
    assert.match(button, /aria-expanded="false"/);
    const id = button.match(/aria-controls="([^"]+)"/)?.[1];
    assert.ok(id, "the button controls the panel");
    assert.ok(panel.startsWith(`<div id="${id}" hidden="">`), panel);
    assert.ok(panel.includes(`leading-8">${DESCRIPTION}</p>`), "the existing paragraph, unchanged text");
  }
  assert.equal(new Set(found.map(({ button }) => button.match(/aria-controls="([^"]+)"/)[1])).size, 2, "unique panel IDs");
  // One visible main heading with the real product name.
  assert.deepEqual([...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((match) => match[1]), [product.perTitle]);
});

test("B1: missing description renders an empty panel, never placeholder text", () => {
  for (const description of [null, undefined, ""]) {
    const html = render({ ...product, description });
    assert.equal(accordions(html).length, 2);
    assert.doesNotMatch(html, />(undefined|null)</);
  }
});

test("other accordions keep mounting their panel only when opened", () => {
  const closed = renderToStaticMarkup(createElement(Accordion, { label: "سوال" }, createElement("p", null, "پاسخ")));
  assert.doesNotMatch(closed, /پاسخ|hidden=""|aria-controls/);
  assert.match(closed, /aria-expanded="false"/);
  const kept = renderToStaticMarkup(createElement(Accordion, { label: "سوال", keepMounted: true }, createElement("p", null, "پاسخ")));
  assert.match(kept, /aria-controls="([^"]+)"[\s\S]*<div id="\1" hidden=""><p>پاسخ<\/p><\/div>/);
});

test("B5: gallery, thumbnail and brand logo alt text are named from the product", () => {
  const html = render(product);
  // Gallery first, then the mobile and desktop brand logos.
  assert.deepEqual(alts(html).filter((alt) => !alt.endsWith("-icon") && alt !== "shape-background"), [
    "دیور هوم اینتنس (Dior Homme Intense) - تصویر ۱",
    "دیور هوم اینتنس (Dior Homme Intense) - تصویر ۲",
    "نمایش تصویر ۱ از دیور هوم اینتنس",
    "نمایش تصویر ۲ از دیور هوم اینتنس",
    "لوگوی دیور",
    "لوگوی دیور",
  ]);
  assert.doesNotMatch(html, /alt="[^"]*(undefined|null|-image-|-thumb-|-fullscreen-)[^"]*"/);
});

test("B5: missing names and brand titles never produce malformed alt text", () => {
  const html = render({ ...product, perTitle: "", enTitle: undefined, brand: { id: 4, iconUrl: "/uploads/x.png" } });
  assert.doesNotMatch(html, /alt="[^"]*(undefined|null)[^"]*"/);
  assert.ok(alts(html).includes("تصویر ۱ محصول"));
  assert.equal(alts(html).filter((alt) => alt === "").length, 2, "an unnamed brand logo is decorative");
});

test("B5: product card images name the product (both responsive images)", () => {
  const html = renderToStaticMarkup(createElement(ProductCard, { product }));
  assert.deepEqual(alts(html).filter((alt) => alt.startsWith("تصویر")), ["تصویر دیور هوم اینتنس", "تصویر دیور هوم اینتنس"]);
  assert.doesNotMatch(html, /-عکس/);
  const unnamed = renderToStaticMarkup(createElement(ProductCard, { product: { ...product, perTitle: undefined, enTitle: undefined } }));
  assert.deepEqual(alts(unnamed).filter((alt) => alt.startsWith("تصویر")), ["تصویر محصول", "تصویر محصول"]);
});
