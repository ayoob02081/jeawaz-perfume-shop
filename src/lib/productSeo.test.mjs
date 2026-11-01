import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCT_TITLE_MAX_LENGTH, productSeoTitle } from "./productSeo.mjs";
import { SITE_NAME, SITE_ORIGIN, socialMetadata } from "./seo.mjs";
import {
  brandLogoAlt,
  productCardImageAlt,
  productGalleryImageAlt,
  productThumbnailAlt,
} from "../utils/productImageAlt.mjs";

const SUFFIX = ` | ${SITE_NAME}`;
const dior = { perTitle: "دیور هوم اینتنس", enTitle: "Dior Homme Intense", concentration: "EAU_DE_PARFUM", grade: "ORIGINAL" };

/* ---------- B2: product titles ---------- */

for (const [name, product, expected] of [
  ["complete: Persian name, concentration, English name, store last", dior,
    "دیور هوم اینتنس ادو پرفیوم (Dior Homme Intense)"],
  ["no concentration", { ...dior, concentration: null }, "دیور هوم اینتنس (Dior Homme Intense)"],
  ["OTHER concentration is not a meaningful strength", { ...dior, concentration: "OTHER" }, "دیور هوم اینتنس (Dior Homme Intense)"],
  ["unknown concentration value is not invented", { ...dior, concentration: "BOGUS" }, "دیور هوم اینتنس (Dior Homme Intense)"],
  ["no English name", { ...dior, enTitle: "" }, "دیور هوم اینتنس ادو پرفیوم"],
  ["English name that is not Latin is not repeated", { ...dior, enTitle: "دیور هوم اینتنس" }, "دیور هوم اینتنس ادو پرفیوم"],
  ["only an English name", { enTitle: "  Dior   Homme Intense ", grade: "ORIGINAL" }, "Dior Homme Intense"],
  ["whitespace is normalized", { ...dior, perTitle: "  دیور   هوم اینتنس ", concentration: undefined }, "دیور هوم اینتنس (Dior Homme Intense)"],
  ["long name: concentration kept, English dropped to stay short",
    { perTitle: "امپوریو آرمانی استرانگر ویت یو اینتنسلی", enTitle: "Emporio Armani Stronger With You Intensely", concentration: "EAU_DE_PARFUM" },
    "امپوریو آرمانی استرانگر ویت یو اینتنسلی ادو پرفیوم"],
  ["concentration already in the Persian name is not repeated",
    { perTitle: "ورساچه کریستال نویر ادو پرفیوم", enTitle: "Versace Crystal Noir Eau de Parfum", concentration: "EAU_DE_PARFUM" },
    "ورساچه کریستال نویر ادو پرفیوم"],
  ["a different strength in the name is not contradicted",
    { perTitle: "دیور ساواج پارفوم", enTitle: "Dior Sauvage Parfum", concentration: "EAU_DE_PARFUM" },
    "دیور ساواج پارفوم (Dior Sauvage Parfum)"],
  ["a strength in an over-long English name still prevents a Persian duplicate",
    { perTitle: "امپوریو آرمانی استرانگر ویت یو", enTitle: "Emporio Armani Stronger With You Parfum", concentration: "PARFUM" },
    "امپوریو آرمانی استرانگر ویت یو"],
  ["concentration only in the English name (abbreviation)",
    { perTitle: "بلو شنل", enTitle: "Bleu de Chanel EDP", concentration: "EAU_DE_PARFUM" }, "بلو شنل (Bleu de Chanel EDP)"],
  ["ZWNJ and Arabic letter variants still count as present",
    { perTitle: "عطر ادو‌پرفیوم نمونه", enTitle: "", concentration: "EAU_DE_PARFUM" }, "عطر ادو‌پرفیوم نمونه"],
  ["Arabic kaf variant", { perTitle: "نمونه ادو كلن", concentration: "EAU_DE_COLOGNE" }, "نمونه ادو كلن"],
  // The English name no longer fits; the concentration is still added.
  ["a house name containing «Parfums» is not a concentration",
    { perTitle: "پارفومز د مارلی لیتون", enTitle: "Parfums de Marly Layton", concentration: "EAU_DE_PARFUM" },
    "پارفومز د مارلی لیتون ادو پرفیوم"],
  ["SUPER_MASTER is stated, like the badge and JSON-LD name",
    { perTitle: "دیور ساواج", enTitle: "Dior Sauvage", concentration: "EAU_DE_PARFUM", grade: "SUPER_MASTER" },
    "دیور ساواج ادو پرفیوم سوپر مستر (Dior Sauvage)"],
  ["legacy original=false is SUPER_MASTER", { perTitle: "دیور ساواج", original: false }, "دیور ساواج سوپر مستر"],
  ["legacy original=true is ORIGINAL (plain name)", { perTitle: "دیور ساواج", original: true }, "دیور ساواج"],
  ["unknown grade gets no grade claim", { perTitle: "دیور ساواج", grade: "FAKE" }, "دیور ساواج"],
  ["SUPER_MASTER already in the name is not repeated", { perTitle: "دیور ساواج سوپر مستر", grade: "SUPER_MASTER" }, "دیور ساواج سوپر مستر"],
  ["SUPER_MASTER is never dropped for length; optional parts are",
    { perTitle: "امپوریو آرمانی استرانگر ویت یو اینتنسلی اکسترا", enTitle: "Long", concentration: "EAU_DE_TOILETTE", grade: "SUPER_MASTER" },
    "امپوریو آرمانی استرانگر ویت یو اینتنسلی اکسترا سوپر مستر"],
]) {
  test(`B2 title: ${name}`, () => {
    assert.equal(productSeoTitle(product), expected + SUFFIX);
  });
}

test("B2 title: missing names produce no title (the page keeps its fallback)", () => {
  for (const product of [null, undefined, {}, { perTitle: "  ", enTitle: "" }, { perTitle: 5 }]) {
    assert.equal(productSeoTitle(product), null);
  }
});

test("B2 title: a very long name is never truncated and gains no optional parts", () => {
  const perTitle = "نام بسیار طولانی ".repeat(6).trim();
  assert.equal(productSeoTitle({ perTitle, enTitle: "Long Name", concentration: "PARFUM" }), perTitle + SUFFIX);
});

test("B2 title: Persian name first, store name once and last, short when optional parts are added", () => {
  for (const product of [dior, { ...dior, grade: "SUPER_MASTER" }, { ...dior, concentration: "EXTRAIT_DE_PARFUM" }]) {
    const title = productSeoTitle(product);
    assert.ok(title.startsWith(product.perTitle));
    assert.ok(title.endsWith(SUFFIX));
    assert.equal(title.split(SITE_NAME).length, 2);
    assert.ok(title.length <= PRODUCT_TITLE_MAX_LENGTH, title);
  }
});

test("B2: share previews use an absolute page title verbatim; other pages keep the store prefix", () => {
  const title = productSeoTitle(dior);
  const social = socialMetadata({ title: { absolute: title }, url: SITE_ORIGIN + "/products/9" });
  assert.equal(social.openGraph.title, title);
  assert.equal(social.twitter.title, title);
  assert.equal(socialMetadata({ title: "درباره ما", url: SITE_ORIGIN }).openGraph.title, `${SITE_NAME} | درباره ما`);
  assert.equal(socialMetadata({ title: { absolute: " " }, url: SITE_ORIGIN }).openGraph.title, SITE_NAME);
});

/* ---------- B5: alt text ---------- */

test("B5 alt: product card, gallery, thumbnail and full-screen labels", () => {
  assert.equal(productCardImageAlt(dior), "تصویر دیور هوم اینتنس");
  assert.equal(productGalleryImageAlt(dior, 0), "دیور هوم اینتنس (Dior Homme Intense) - تصویر ۱");
  assert.equal(productGalleryImageAlt(dior, 11), "دیور هوم اینتنس (Dior Homme Intense) - تصویر ۱۲");
  assert.equal(productThumbnailAlt(dior, 1), "نمایش تصویر ۲ از دیور هوم اینتنس");
  // Persian-only and English-only products; an English name equal to the Persian one is not repeated.
  assert.equal(productGalleryImageAlt({ perTitle: "دیور" }, 0), "دیور - تصویر ۱");
  assert.equal(productGalleryImageAlt({ enTitle: "Dior" }, 0), "Dior - تصویر ۱");
  assert.equal(productGalleryImageAlt({ perTitle: "Dior", enTitle: "dior" }, 0), "Dior - تصویر ۱");
  assert.equal(productCardImageAlt({ enTitle: " Dior  Sauvage " }), "تصویر Dior Sauvage");
});

test("B5 alt: missing product data never yields undefined or malformed text", () => {
  for (const product of [null, undefined, {}, { perTitle: null, enTitle: 3 }]) {
    assert.equal(productCardImageAlt(product), "تصویر محصول");
    assert.equal(productGalleryImageAlt(product, 0), "تصویر ۱ محصول");
    assert.equal(productThumbnailAlt(product, 2), "نمایش تصویر ۳");
  }
  for (const index of [undefined, -1, 1.5, NaN, "2"]) {
    assert.equal(productGalleryImageAlt(dior, index), "دیور هوم اینتنس (Dior Homme Intense) - تصویر ۱");
  }
});

test("B5 alt: brand logos use the brand's own name or are decorative", () => {
  assert.equal(brandLogoAlt({ title: " دیور ", value: "dior" }), "لوگوی دیور");
  assert.equal(brandLogoAlt({ title: "Dior" }), "لوگوی Dior");
  for (const brand of [null, undefined, {}, { value: "dior" }, { title: "  " }, { title: 7 }]) {
    assert.equal(brandLogoAlt(brand), "");
  }
});
