// SEO audit F5–F7: utility/private noindex coordinated with robots.txt, one
// main heading on the primary storefront pages, and explicit social metadata.
// Route sources are checked narrowly; rendered output is verified separately
// against a production build.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  privateRobots,
  publicPageMetadata,
  robotsMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  socialMetadata,
  utilityRobots,
} from "./seo.mjs";

const read = (path) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");

/* ---------- F5 ---------- */

test("F5: public utility pages are noindex but crawlable; private areas are not crawled", () => {
  assert.deepEqual(utilityRobots(), { index: false, follow: true });
  assert.deepEqual(privateRobots(), { index: false, follow: false });
  const { disallow } = robotsMetadata().rules;
  // A Disallow would hide the noindex on these from crawlers.
  for (const path of ["/cart", "/auth"]) {
    assert.ok(!disallow.some((rule) => path.startsWith(rule)), path);
  }
  for (const path of ["/admin", "/profile", "/payment"]) assert.ok(disallow.includes(path), path);
  // Public catalog and rendering assets stay crawlable.
  for (const path of ["/", "/products", "/products/105", "/page/terms", "/_next/static/x.js"]) {
    assert.ok(!disallow.some((rule) => path.startsWith(rule)), path);
  }
});

test("F5: cart, login, admin and profile declare their robots policy at a server boundary", () => {
  const cart = read("(user)/cart/page.jsx");
  const login = read("(user)/auth/login/page.jsx");
  const admin = read("(admin)/admin/layout.jsx");
  const profile = read("(profile)/profile/layout.jsx");
  for (const source of [cart, login, admin, profile]) {
    assert.doesNotMatch(source, /^["']use client["']/, "metadata needs a server component");
  }
  assert.match(cart, /robots: utilityRobots\(\),/);
  assert.match(login, /robots: utilityRobots\(\),/);
  // Login no longer reuses the homepage title.
  assert.match(login, /title: "ورود \| ثبت نام",/);
  assert.match(admin, /robots: privateRobots\(\),/);
  assert.match(profile, /robots: privateRobots\(\),/);
  // The already-excluded payment result keeps its own rule.
  assert.match(read("(user)/payment/result/page.jsx"), /robots: \{ index: false, follow: false \}/);
});

/* ---------- F6 ---------- */

test("F6: product, home and listing pages each render one main heading", () => {
  const product = read("(user)/products/_components/SingleProductPage.jsx");
  // The product name itself, with its existing classes.
  assert.match(product, /<h1 className="font-bold text-wrap text-\[28px\] w-full text-stroke-800">\s*\{product\.perTitle\}\s*<\/h1>/);
  assert.equal(product.match(/<h1\b/g).length, 1);
  const home = read("(user)/page.jsx");
  assert.match(home, /<h1 className="sr-only">\{SITE_NAME\}<\/h1>/);
  assert.equal(home.match(/<h1\b/g).length, 1);
  const listing = read("(user)/products/page.jsx");
  // The listing's own resolved title (brand landing title or «محصولات»).
  assert.match(listing, /<h1 className="sr-only">\{listingMetadata\(query, snapshot\)\.title\}<\/h1>/);
  assert.equal(listing.match(/<h1\b/g).length, 1);
  // Shared chrome adds no competing h1 on these pages.
  for (const shared of ["Header.jsx", "Footer.jsx", "layout.jsx", "(user)/layout.jsx", "(user)/products/[id]/layout.jsx"]) {
    assert.doesNotMatch(read(shared), /<h1\b/, shared);
  }
});

/* ---------- F7 ---------- */

test("F7: social metadata uses the page's own title, description, canonical and real image", () => {
  const product = socialMetadata({
    title: " دیور ساواج ", description: " توضیح ", url: `${SITE_ORIGIN}/products/105`,
    images: ["https://api.jeawaz.com/uploads/a.jpg", "https://api.jeawaz.com/uploads/b.jpg"],
  });
  assert.deepEqual(product, {
    openGraph: {
      type: "website", siteName: SITE_NAME, locale: "fa_IR",
      title: `${SITE_NAME} | دیور ساواج`, url: `${SITE_ORIGIN}/products/105`,
      description: "توضیح", images: [{ url: "https://api.jeawaz.com/uploads/a.jpg" }],
    },
    twitter: {
      card: "summary_large_image", title: `${SITE_NAME} | دیور ساواج`,
      description: "توضیح", images: ["https://api.jeawaz.com/uploads/a.jpg"],
    },
  });
  // Home: the site name and description; no title template duplication.
  assert.deepEqual(socialMetadata({ description: SITE_DESCRIPTION, url: `${SITE_ORIGIN}/` }).openGraph.title, SITE_NAME);
});

test("F7: unknown values are omitted, never invented", () => {
  for (const images of [undefined, [], [""], [null], ["/uploads/a.jpg"], ["javascript:alert(1)"], "https://x/y.jpg"]) {
    const { openGraph, twitter } = socialMetadata({ title: "x", url: `${SITE_ORIGIN}/products/1`, images });
    assert.equal(openGraph.images, undefined, String(images));
    assert.equal(twitter.images, undefined);
    assert.equal(twitter.card, "summary");
  }
  for (const description of [undefined, null, "", "   ", 5]) {
    const { openGraph, twitter } = socialMetadata({ title: "x", description, url: `${SITE_ORIGIN}/` });
    assert.equal(openGraph.description, undefined);
    assert.equal(twitter.description, undefined);
  }
});

test("F7: only jeawaz.com canonical URLs are accepted as og:url", () => {
  for (const url of [undefined, "", "/products/1", "https://evil.com/", "https://jeawaz.com.evil.com/", "http://jeawaz.com/", "https://jeawaz.comx/"]) {
    assert.throws(() => socialMetadata({ title: "x", url }), /canonical jeawaz\.com URL/, String(url));
  }
  assert.equal(socialMetadata({ url: SITE_ORIGIN }).openGraph.url, SITE_ORIGIN);
});

test("F7: indexable public pages set their own preview; the root and utility pages do not", () => {
  const root = read("layout.jsx");
  assert.doesNotMatch(root, /\b(openGraph|twitter):/, "an inherited og:url would point at another page");
  assert.match(root, /title: \{ default: SITE_NAME, template: `\$\{SITE_NAME\} \| %s` \},/);
  assert.match(root, /description: SITE_DESCRIPTION,/);
  // Home and information pages: canonical + preview from one route path.
  assert.match(read("(user)/page.jsx"), /export const metadata = publicPageMetadata\(\{ description: SITE_DESCRIPTION, path: "\/" \}\);/);
  for (const [file, path] of [["about-us", "/page/about-us"], ["contact-us", "/page/contact-us"], ["terms", "/page/terms"]]) {
    const source = read(`(user)/page/${file}/page.jsx`);
    assert.match(source, new RegExp(`\\.\\.\\.publicPageMetadata\\(\\{ \\.\\.\\.metadataFields, path: "${path}" \\}\\)`));
    assert.doesNotMatch(source, /alternates:|canonical:/, "only the helper sets the canonical");
  }
  const productRoute = read("(user)/products/[id]/page.jsx");
  assert.match(productRoute, /buildProductJsonLd\(product, process\.env\.NEXT_PUBLIC_API_URL\)\?\.image \?\? \[\]/);
  // The preview shares the document title (one `title` value) and description.
  assert.match(productRoute, /const title = seoTitle \? \{ absolute: seoTitle \} : product\.perTitle;/);
  assert.match(productRoute, /title,\s+description: product\.description,/);
  assert.match(productRoute, /\.\.\.socialMetadata\(\{ title, description: product\.description, url: canonical, images \}\)/);
  // Listing: only states with a canonical (indexable) get a preview.
  const listing = read("(user)/products/page.jsx");
  assert.match(listing, /if \(!canonical\) return metadata;/);
  for (const utility of ["(user)/cart/page.jsx", "(user)/auth/login/page.jsx", "(admin)/admin/layout.jsx", "(profile)/profile/layout.jsx", "(user)/payment/result/page.jsx"]) {
    assert.doesNotMatch(read(utility), /socialMetadata|publicPageMetadata|\bopenGraph:|canonical/, utility);
  }
});

test("canonical: public pages get a self-referencing canonical equal to og:url", () => {
  for (const [path, title] of [["/", undefined], ["/page/about-us", "درباره ما"], ["/page/contact-us", "تماس با ما"], ["/page/terms", "قوانین و مقررات"]]) {
    const metadata = publicPageMetadata({ title, description: "d", path });
    assert.equal(metadata.alternates.canonical, SITE_ORIGIN + path);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.deepEqual(Object.keys(metadata).sort(), ["alternates", "openGraph", "twitter"]);
  }
  // Only plain route paths: never another origin, a query, a fragment or a protocol-relative URL.
  for (const path of [undefined, "", "page/terms", "//evil.com", "/page/terms?x=1", "/page/terms#a", "/page/terms/", "https://jeawaz.com/", "/page/../admin", "/Page/Terms"]) {
    assert.throws(() => publicPageMetadata({ path }), /plain route path/, String(path));
  }
});
