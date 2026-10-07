import assert from "node:assert/strict";
import test from "node:test";
import {
  COUPON_TARGETS,
  NOTIFICATION_TARGETS,
  PICKER_PAGE_SIZE,
  buildCouponTargetPayload,
  buildNotificationTargetPayload,
  buildProductPickerParams,
  buildUserPickerParams,
  campaignProductSnapshots,
  campaignScopeProductType,
  cancelDraft,
  clearSelection,
  confirmDraft,
  couponUserSnapshots,
  dedupeById,
  getNextProductPage,
  getNextUserCursor,
  isDraftChanged,
  isSelected,
  mergePages,
  normalizeIds,
  normalizePhoneSearch,
  normalizeUserSearch,
  openDraft,
  productVariantTypes,
  removeFromSelection,
  toCampaignProductsPayload,
  toProductSnapshot,
  toUserIdsPayload,
  toUserSnapshot,
  toggleSelection,
} from "./entityPickerContract.mjs";
import { normalizeProductsQuery } from "./productFilterContract.mjs";

const product = (id, perTitle, extra = {}) => ({
  id,
  perTitle,
  enTitle: `${perTitle} EN`,
  images: [`/uploads/${id}.webp`],
  brand: { id: 1, title: "Dior" },
  ...extra,
});
const snap = (item) => toProductSnapshot(item);

test("normalizeIds keeps unique positive integers in order", () => {
  assert.deepEqual(normalizeIds([3, "2", 3, 0, -1, 1.5, "x", null, "2", 7]), [3, 2, 7]);
  assert.deepEqual(normalizeIds(undefined), []);
});

test("toggle, remove and clear never keep duplicates", () => {
  let selection = [];
  selection = toggleSelection(selection, snap(product(1, "الف")));
  selection = toggleSelection(selection, snap(product(2, "ب")));
  assert.deepEqual(selection.map((item) => item.id), [1, 2]);
  assert.equal(isSelected(selection, "2"), true);

  selection = toggleSelection(selection, snap(product(1, "الف")));
  assert.deepEqual(selection.map((item) => item.id), [2]);

  assert.deepEqual(removeFromSelection([...selection, { id: 5 }], 2), [{ id: 5 }]);
  assert.deepEqual(clearSelection(), []);
  assert.deepEqual(
    dedupeById([{ id: 1, a: 1 }, { id: "1", a: 2 }, { id: 0 }, null]),
    [{ id: 1, a: 1 }],
  );
});

test("selection survives a different search, filter and page", () => {
  // Two Dior products from one search page…
  const diorPage = [product(1, "دیور ۱"), product(2, "دیور ۲"), product(3, "دیور ۳")];
  let draft = openDraft([]);
  draft = toggleSelection(draft, snap(diorPage[0]));
  draft = toggleSelection(draft, snap(diorPage[1]));

  // …then three Amouage products from another search; the Dior items are no
  // longer visible but stay selected.
  const amouagePages = [
    { data: [product(10, "آمواژ ۱"), product(11, "آمواژ ۲")], meta: { page: 1, totalPages: 2 } },
    { data: [product(12, "آمواژ ۳")], meta: { page: 2, totalPages: 2 } },
  ];
  for (const item of mergePages(amouagePages)) draft = toggleSelection(draft, snap(item));

  assert.deepEqual(confirmDraft(draft).map((item) => item.id), [1, 2, 10, 11, 12]);
});

test("Cancel keeps the committed selection; Confirm commits the draft", () => {
  const committed = Object.freeze([Object.freeze(snap(product(1, "الف")))]);
  let draft = openDraft(committed);
  assert.notEqual(draft, committed);

  draft = toggleSelection(draft, snap(product(2, "ب")));
  draft = removeFromSelection(draft, 1);

  assert.equal(cancelDraft(committed), committed);
  assert.deepEqual(committed.map((item) => item.id), [1]);
  assert.deepEqual(confirmDraft(draft).map((item) => item.id), [2]);
});

test("isDraftChanged ignores order and re-checks", () => {
  const committed = [{ id: 1 }, { id: 2 }];
  assert.equal(isDraftChanged(committed, [{ id: 2 }, { id: 1 }]), false);
  assert.equal(
    isDraftChanged(committed, toggleSelection(toggleSelection(committed, { id: 1 }), { id: 1 })),
    false,
  );
  assert.equal(isDraftChanged(committed, [{ id: 1 }]), true);
  assert.equal(isDraftChanged(committed, [{ id: 1 }, { id: 3 }]), true);
});

test("mergePages flattens pages without duplicate entities", () => {
  const pages = [
    { data: [{ id: 1 }, { id: 2 }] },
    { data: [{ id: 2 }, { id: 3 }] },
    { data: null },
  ];
  assert.deepEqual(mergePages(pages).map((item) => item.id), [1, 2, 3]);
  assert.deepEqual(mergePages(undefined), []);
});

test("product snapshots from list items and Campaign detail", () => {
  assert.deepEqual(toProductSnapshot(product(4, "ساواج", { variants: [], stock: 9 })), {
    id: 4,
    perTitle: "ساواج",
    enTitle: "ساواج EN",
    image: "/uploads/4.webp",
    brandTitle: "Dior",
  });

  const manual = {
    selectionMode: "manual",
    products: [
      { productId: 4, product: { id: 4, perTitle: "ساواج", enTitle: "Sauvage", images: [] } },
      { productId: 9 },
      { productId: 4, product: { id: 4, perTitle: "تکراری" } },
    ],
  };
  assert.deepEqual(campaignProductSnapshots(manual), [
    { id: 4, perTitle: "ساواج", enTitle: "Sauvage", image: null, brandTitle: null },
    { id: 9, perTitle: "محصول #9", enTitle: null, image: null, brandTitle: null },
  ]);
});

test("an all-mode Campaign never seeds a manual selection", () => {
  const all = { selectionMode: "all", products: [{ productId: 1, product: { id: 1 } }] };
  assert.deepEqual(campaignProductSnapshots(all), []);
  assert.deepEqual(campaignProductSnapshots(undefined), []);
});

test("campaign scope maps to the forced product Variant type", () => {
  assert.equal(campaignScopeProductType("product"), undefined);
  assert.equal(campaignScopeProductType("sealed"), "sealed");
  assert.equal(campaignScopeProductType("decant"), "decant");
  assert.deepEqual(
    productVariantTypes({ variants: [{ type: "sealed" }, { type: "decant" }, { type: "sealed" }] }),
    ["decant", "sealed"],
  );
});

test("product picker params: page size 20, newest, availabilityFirst=false", () => {
  assert.deepEqual(buildProductPickerParams({}), {
    search: undefined,
    brandIds: undefined,
    type: undefined,
    inStock: undefined,
    availabilityFirst: false,
    sort: "newest",
    limit: PICKER_PAGE_SIZE,
  });
  const params = buildProductPickerParams({
    search: "  dior   sauvage ",
    brandId: "3",
    type: "sealed",
    inStock: true,
  });
  assert.deepEqual(params, {
    search: "dior sauvage",
    brandIds: [3],
    type: "sealed",
    inStock: true,
    availabilityFirst: false,
    sort: "newest",
    limit: 20,
  });
  assert.equal(buildProductPickerParams({ type: "SEALED", inStock: "true" }).type, undefined);

  // The request layer keeps every picker value.
  const wire = normalizeProductsQuery({ ...params, page: 2 });
  assert.equal(wire.availabilityFirst, false);
  assert.equal(wire.limit, 20);
  assert.equal(wire.page, 2);
  assert.equal(wire.type, "sealed");
  assert.deepEqual(wire.brandIds, [3]);
  assert.equal(wire.inStock, true);
  assert.equal(wire.sort, "newest");
});

test("product next page: page + 1 while page < totalPages", () => {
  assert.equal(getNextProductPage({ meta: { page: 1, totalPages: 3 } }), 2);
  assert.equal(getNextProductPage({ meta: { page: 3, totalPages: 3 } }), undefined);
  assert.equal(getNextProductPage({ meta: { page: 1, totalPages: 0 } }), undefined);
  assert.equal(getNextProductPage(undefined), undefined);
});

test("user snapshots keep only identification fields", () => {
  const adminRow = {
    id: 7,
    fullName: "سارا احمدی",
    phoneNumber: "989121234567",
    email: "sara@example.com",
    role: "user",
    accountStatus: "banned",
    phoneVerified: true,
    ordersCount: 3,
    totalSpent: 9_000_000,
    totalPurchases: 4,
    addressesCount: 2,
    createdAt: "2026-01-01",
    lastLogin: null,
  };
  assert.deepEqual(toUserSnapshot(adminRow), {
    id: 7,
    fullName: "سارا احمدی",
    phoneNumber: "989121234567",
    email: "sara@example.com",
  });
  assert.deepEqual(Object.keys(toUserSnapshot(adminRow)).sort(), [
    "email",
    "fullName",
    "id",
    "phoneNumber",
  ]);

  // GET /coupons/:id allowedUsers shape.
  assert.deepEqual(
    couponUserSnapshots({
      allowedUsers: [
        { id: 4, firstName: "علی", lastName: null, phoneNumber: "09121112233" },
        { id: 4, firstName: "تکراری", lastName: null, phoneNumber: "0" },
      ],
    }),
    [{ id: 4, fullName: "علی", phoneNumber: "09121112233", email: null }],
  );
  assert.deepEqual(toUserSnapshot({ id: 5 }), {
    id: 5,
    fullName: null,
    phoneNumber: null,
    email: null,
  });
});

test("phone-like searches become the shared subscriber digits", () => {
  for (const [typed, expected] of [
    ["09123456789", "9123456789"],
    ["+989123456789", "9123456789"],
    ["989123456789", "9123456789"],
    ["00989123", "9123"],
    ["۰۹۱۲ ۳۴۵", "912345"],
    ["٠٩١٢-٣٤٥", "912345"],
    ["4567", "4567"],
  ]) {
    assert.equal(normalizePhoneSearch(typed), expected, typed);
  }
  for (const typed of ["علی", "a@b.c", "0", "+98", "", undefined]) {
    assert.equal(normalizePhoneSearch(typed), null, String(typed));
  }
  assert.equal(normalizeUserSearch("  علی   رضایی "), "علی رضایی");
  assert.equal(normalizeUserSearch("0"), "0");
});

test("user picker params send only search and limit", () => {
  assert.deepEqual(buildUserPickerParams({ search: "+98 912 345" }), {
    search: "912345",
    limit: 20,
  });
  assert.deepEqual(buildUserPickerParams({}), { search: undefined, limit: 20 });
  assert.deepEqual(Object.keys(buildUserPickerParams({ search: "x" })).sort(), [
    "limit",
    "search",
  ]);
});

test("user next cursor: follow nextCursor, stop on an empty page", () => {
  assert.equal(getNextUserCursor({ data: [{ id: 1 }], nextCursor: "abc" }), "abc");
  assert.equal(getNextUserCursor({ data: [{ id: 1 }], nextCursor: null }), undefined);
  assert.equal(getNextUserCursor({ data: [], nextCursor: "abc" }), undefined);
  assert.equal(getNextUserCursor(undefined), undefined);
});

test("payload builders send IDs only", () => {
  const selection = [snap(product(5, "الف")), { id: "6" }, { id: 5 }];
  assert.deepEqual(toCampaignProductsPayload(selection), [{ productId: 5 }, { productId: 6 }]);
  assert.deepEqual(toUserIdsPayload([{ id: 3, fullName: "x" }, { id: 3 }, { id: 8 }]), [3, 8]);
  assert.deepEqual(toCampaignProductsPayload(undefined), []);
});

test("coupon and notification targets omit userIds unless specific", () => {
  const users = [{ id: 2 }, { id: 9 }];
  assert.deepEqual(
    buildCouponTargetPayload({ target: COUPON_TARGETS.SELECTED_USERS, selectedUsers: users }),
    { target: "SELECTED_USERS", userIds: [2, 9] },
  );
  assert.deepEqual(
    buildCouponTargetPayload({ target: COUPON_TARGETS.ALL, selectedUsers: users }),
    { target: "ALL" },
  );
  assert.deepEqual(
    buildNotificationTargetPayload({ target: NOTIFICATION_TARGETS.USER, selectedUsers: users }),
    { target: "USER", userIds: [2, 9] },
  );
  assert.deepEqual(
    buildNotificationTargetPayload({ target: NOTIFICATION_TARGETS.ALL, selectedUsers: users }),
    { target: "ALL" },
  );
});
