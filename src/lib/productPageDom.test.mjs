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
import { listingSeoMetadata } from "./listingSeo.mjs";
import { categoryLandingPath, SITE_ORIGIN } from "./seo.mjs";
import { productsQueryFromSearchParams } from "../utils/productFilterContract.mjs";

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
  // The reads are covered by relatedProducts tests; here only the outcome matters.
  "@/lib/relatedProducts.server.mjs": { fetchRelatedProducts: async (args) => related(args) },
};
let related = async () => [];

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
const RelatedProductsSection = component("app/(user)/products/_components/RelatedProductsSection");
const relatedModule = load(file(SRC + "app/(user)/products/_components/RelatedProducts"));

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

/* ---------- Phase 2: attribute links and related products ---------- */

const category = (type, slug, title, extra = {}) => ({ id: `${type}-${slug}`, type, slug, title, isActive: true, ...extra });
const categorized = {
  ...product,
  categories: {
    gender: category("gender", "male", "مردانه"),
    fragranceFamilies: [category("fragrance_family", "woody", "چوبی"), category("fragrance_family", "floral", "گلی", { isActive: false })],
    seasons: [category("season", "spring", "بهار")],
    temperature: category("temperature", "warm", "گرم"),
    characters: [category("character", "sweet", "شیرین", { slug: " " })],
    occasions: [category("season", "party", "مهمانی")],
  },
};
const categoryLinks = (html) => [...html.matchAll(/<a href="(\/products\?(?!brandIds)[^"]+)"[^>]*>([^<]*)<\/a>/g)]
  .map(([, href, text]) => [href.replace(/&amp;/g, "&"), text]);

test("attribute values link to their indexable single-category landing; others stay text", () => {
  const html = render(categorized);
  assert.deepEqual(categoryLinks(html), [
    ["/products?gender=male", "مردانه"],
    ["/products?fragranceFamilies=woody", "چوبی"],
    ["/products?seasons=spring", "بهار"],
    ["/products?temperature=warm", "گرم"],
  ]);
  // Inactive, slug-less and wrong-type categories: the same name, without a link.
  for (const name of ["گلی", "شیرین", "مهمانی"]) {
    assert.match(html, new RegExp(`<p>${name}</p>`), name);
  }
  // Each target is the listing's own canonical, indexable landing (the sitemap URL).
  const snapshot = { data: [categorized], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } };
  for (const [href] of categoryLinks(html)) {
    const query = productsQueryFromSearchParams(new URLSearchParams(href.split("?")[1]));
    const metadata = listingSeoMetadata(query, snapshot);
    assert.deepEqual(metadata.robots, { index: true, follow: true }, href);
    assert.equal(metadata.alternates.canonical, SITE_ORIGIN + href);
  }
  assert.equal(categoryLandingPath("gender", { ...categorized.categories.gender, isActive: undefined }), null);
});

const card = (id) => ({ ...product, id, perTitle: `محصول ${id}`, enTitle: `Product ${id}` });
const sectionHtml = (props) => renderToStaticMarkup(createElement(RelatedProductsSection, props));

test("related section: labelled heading, real product links, no controls before measuring", () => {
  const more = { href: "/products?fragranceFamilies=woody", label: "مشاهده عطر و ادکلن با رایحه چوبی" };
  const html = sectionHtml({ products: [card(51), card(52), card(53)], more });
  // (React hoists the priority card images' preload links before it.)
  const id = html.match(/<section aria-labelledby="([^"]+)"/)?.[1];
  assert.ok(id);
  assert.match(html, new RegExp(`<h2 id="${id}"[^>]*><span class="text-primary">عطرهایی که</span> شاید بپسندی</h2>`));
  const productLinks = [...new Set([...html.matchAll(/href="\/products\/(\d+)"/g)].map((match) => match[1]))];
  assert.deepEqual(productLinks, ["51", "52", "53"]);
  assert.doesNotMatch(html, /محصولات (قبلی|بعدی)/, "scroll controls only appear once the row overflows");
  // One "more" link per breakpoint, to the real category landing.
  assert.equal(html.split(`href="${more.href}"`).length - 1, 2);
  assert.equal(html.split(more.label).length - 1, 2);
  assert.doesNotMatch(sectionHtml({ products: [card(51), card(52)], more: null }), /fragranceFamilies/);
});

test("related products server component: hidden without suitable products, rendered with them", async () => {
  related = async () => [];
  assert.equal(await relatedModule.default({ product: categorized }), null);
  let received;
  related = async (args) => { received = args; return [card(61), card(62)]; };
  const element = await relatedModule.default({ product: categorized });
  assert.equal(received.product, categorized);
  assert.equal(element.type, RelatedProductsSection);
  assert.deepEqual(element.props.products.map((item) => item.id), [61, 62]);
  // "More like this": the first active family landing, named like its heading.
  assert.deepEqual(element.props.more, { href: "/products?fragranceFamilies=woody", label: "مشاهده عطر و ادکلن با رایحه چوبی" });
  assert.equal(relatedModule.relatedMoreLink({ categories: { fragranceFamilies: [category("fragrance_family", "floral", "گلی", { isActive: false })] } }), null);
  assert.equal(relatedModule.relatedMoreLink({ categories: { fragranceFamilies: [category("fragrance_family", "x", "Latin")] } }), null);
  assert.equal(relatedModule.relatedMoreLink(null), null);
  related = async () => [];
});
