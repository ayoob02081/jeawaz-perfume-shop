// B3: indexable single-category landings get their own Persian title and a
// short factual description from the snapshot's category record; every other
// listing state keeps its existing robots/canonical policy and generic text.
import test from "node:test";
import assert from "node:assert/strict";
import { listingSeoMetadata } from "./listingSeo.mjs";
import { CATEGORY_TYPES, SITE_ORIGIN } from "./seo.mjs";
import { productsQueryFromSearchParams } from "../utils/productFilterContract.mjs";

const query = (search) => productsQueryFromSearchParams(new URLSearchParams(search));
const category = (type, slug, title, description, overrides = {}) =>
  ({ type, slug, title, description, isActive: true, ...overrides });
const payload = (search, data, total = 36) => {
  const q = query(search);
  return { data, meta: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } };
};
const classify = (search, data) => listingSeoMetadata(query(search), payload(search, data));
const products = (key, ...records) => records.map((record, id) => ({
  id: id + 1, categories: { [key]: key === "gender" || key === "temperature" ? record : [record] },
}));
const indexed = (path) => ({ robots: { index: true, follow: true }, alternates: { canonical: SITE_ORIGIN + path } });
const TAIL = "مشاهده {h} در جیاواز پرفیوم؛ بررسی قیمت، حجم و وضعیت موجودی محصولات.";

for (const [key, slug, title, description, heading] of [
  ["gender", "male", "مردانه", "عطرهای مناسب آقایان", "عطر و ادکلن مردانه"],
  ["fragranceFamilies", "woody", "چوبی", "رایحه‌هایی با محوریت چوب‌هایی مانند سدر، صندل و عود.", "عطر و ادکلن با رایحه چوبی"],
  ["seasons", "spring", "بهار", "مناسب استفاده در فصل بهار", "عطر و ادکلن مناسب فصل بهار"],
  ["temperature", "warm", "گرم", "رایحه‌هایی با طبع گرم", "عطر و ادکلن با طبع گرم"],
  ["characters", "sweet", "شیرین", "رایحه‌هایی با شخصیت شیرین", "عطر و ادکلن با شخصیت شیرین"],
  ["occasions", "party", "مهمانی", "مناسب مهمانی‌ها", "عطر و ادکلن مناسب مهمانی"],
]) {
  test(`B3: ${key} landing has its own title and description, canonical unchanged`, () => {
    const record = category(CATEGORY_TYPES[key], slug, title, description);
    for (const page of [1, 2]) {
      const search = `${key}=${slug}` + (page > 1 ? `&page=${page}` : "");
      const summary = description.replace(/\.$/, "");
      assert.deepEqual(classify(search, products(key, record, { ...record })), {
        title: heading,
        description: `${summary}. ` + TAIL.replace("{h}", heading),
        ...indexed(`/products?${key}=${slug}` + (page > 1 ? `&page=${page}` : "")),
      });
    }
  });
}

test("B3: different categories never share metadata", () => {
  const seen = new Set();
  for (const [key, type] of Object.entries(CATEGORY_TYPES)) {
    for (const [slug, title] of [["a", "الف"], ["b", "ب"]]) {
      const { title: heading, description } = classify(`${key}=${slug}`, products(key, category(type, slug, title, "")));
      assert.ok(!seen.has(heading) && !seen.has(description), heading);
      seen.add(heading).add(description);
    }
  }
});

test("B3: a qualifier already in the category title is not repeated", () => {
  const record = category("season", "winter", "فصل زمستان", "");
  assert.equal(classify("seasons=winter", products("seasons", record)).title, "عطر و ادکلن فصل زمستان");
});

test("B3: missing, long or conflicting descriptions leave only the factual tail", () => {
  for (const descriptions of [[undefined], [""], ["  "], ["x".repeat(121)], ["الف", "ب"]]) {
    const records = descriptions.map((description) => category("gender", "male", "مردانه", description));
    assert.equal(classify("gender=male", products("gender", ...records)).description,
      TAIL.replace("{h}", "عطر و ادکلن مردانه"), JSON.stringify(descriptions));
  }
});

test("B3: without one usable Persian category name the landing keeps the generic text", () => {
  for (const titles of [[undefined], [""], ["Men"], ["مردانه", "آقایان"]]) {
    const records = titles.map((title) => category("gender", "male", title, "توضیح"));
    assert.deepEqual(classify("gender=male", products("gender", ...records)), indexed("/products?gender=male"), JSON.stringify(titles));
  }
});

test("B3: noindex states stay noindex and gain no category title", () => {
  const record = category("gender", "male", "مردانه", "عطرهای مناسب آقایان");
  const data = products("gender", record);
  const noindex = { robots: { index: false, follow: true } };
  for (const search of ["gender=male&search=dior", "gender=male&sort=oldest", "gender=male&limit=24",
    "gender=male&inStock=true", "gender=male&minPrice=1000", "gender=male&grades=ORIGINAL",
    "gender=male&seasons=spring", "gender=male&brandIds=1"]) {
    assert.deepEqual(classify(search, data), noindex, search);
  }
  // Inactive, mismatched or absent memberships are still excluded.
  assert.deepEqual(classify("gender=male", products("gender", { ...record, isActive: false })), noindex);
  assert.deepEqual(classify("gender=women", data), noindex);
  assert.deepEqual(listingSeoMetadata(query("gender=male"), payload("gender=male", [], 0)), noindex);
});

test("B3: base listing and approved brand landings are unchanged", () => {
  assert.deepEqual(classify("", products("gender", category("gender", "male", "مردانه", "x"))), indexed("/products"));
  const brand = { id: 4, title: "دیور" };
  assert.deepEqual(classify("brandIds=4", [{ id: 1, brand, categories: {} }]), {
    title: "عطر و ادکلن دیور",
    description: "مشاهده عطر و ادکلن دیور در جیاواز پرفیوم؛ بررسی قیمت، حجم و وضعیت موجودی محصولات.",
    ...indexed("/products?brandIds=4"),
  });
});
