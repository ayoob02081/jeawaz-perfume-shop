// Pure state and wire helpers for the admin Product/User picker modals.
// Selections are ordered arrays of lightweight snapshots (UI only); mutation
// payloads are always built from their IDs.

export const PICKER_PAGE_SIZE = 20;
export const PICKER_SEARCH_DEBOUNCE_MS = 300;

/* ================= IDS ================= */

export function normalizeEntityId(value) {
  const id = typeof value === "string" && value.trim() ? Number(value) : value;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Unique positive integer IDs, first occurrence order kept.
export function normalizeIds(values = []) {
  const ids = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const id = normalizeEntityId(value);
    if (id !== null && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/* ================= SELECTION ================= */

// Snapshots with a valid ID, unique by ID (first occurrence wins).
export function dedupeById(items = []) {
  const result = [];
  const seen = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const id = normalizeEntityId(item?.id);
    if (id !== null && !seen.has(id)) {
      seen.add(id);
      result.push({ ...item, id });
    }
  }
  return result;
}

export const selectedIdSet = (selection = []) =>
  new Set(dedupeById(selection).map((item) => item.id));

export const isSelected = (selection, id) =>
  selectedIdSet(selection).has(normalizeEntityId(id));

// Adds the snapshot, or removes its ID when already selected.
export function toggleSelection(selection = [], snapshot) {
  const id = normalizeEntityId(snapshot?.id);
  if (id === null) return dedupeById(selection);
  return isSelected(selection, id)
    ? removeFromSelection(selection, id)
    : dedupeById([...selection, { ...snapshot, id }]);
}

export function removeFromSelection(selection = [], id) {
  const target = normalizeEntityId(id);
  return dedupeById(selection).filter((item) => item.id !== target);
}

export const clearSelection = () => [];

// The draft is a copy: editing it never touches the committed form value.
export const openDraft = (committed = []) => dedupeById(committed);
export const confirmDraft = (draft = []) => dedupeById(draft);
export const cancelDraft = (committed) => committed;

// Order-insensitive: unchecking and re-checking an item is no change.
export function isDraftChanged(committed = [], draft = []) {
  const before = selectedIdSet(committed);
  const after = selectedIdSet(draft);
  return before.size !== after.size || [...after].some((id) => !before.has(id));
}

// Infinite-query pages flattened without duplicate entities (offset pages can
// shift while Products are added).
export function mergePages(pages = [], getItems = (page) => page?.data) {
  return dedupeById(
    (Array.isArray(pages) ? pages : []).flatMap((page) => getItems(page) ?? []),
  );
}

/* ================= PRODUCTS ================= */

export const productFallbackTitle = (id) => `محصول #${id}`;

// Accepts a GET /products item or a Campaign detail `products[].product`.
export function toProductSnapshot(product) {
  const id = normalizeEntityId(product?.id);
  if (id === null) return null;
  const images = Array.isArray(product.images) ? product.images : [];
  return {
    id,
    perTitle: product.perTitle || product.enTitle || productFallbackTitle(id),
    enTitle: product.enTitle || null,
    image: product.image || images.find(Boolean) || null,
    brandTitle: product.brand?.title || product.brand?.value || product.brandTitle || null,
  };
}

// Manual Campaigns only: an `all` Campaign links every Product, which must
// never become a manual preselection.
export function campaignProductSnapshots(campaign) {
  if (campaign?.selectionMode !== "manual") return [];
  return dedupeById(
    (campaign.products || []).map((item) => {
      const id = normalizeEntityId(item?.product?.id ?? item?.productId);
      if (id === null) return null;
      return item.product
        ? toProductSnapshot({ ...item.product, id })
        : toProductSnapshot({ id });
    }),
  );
}

const CAMPAIGN_SCOPE_TYPES = Object.freeze({ sealed: "sealed", decant: "decant" });

// The Variant type a Campaign scope requires: product -> none.
export const campaignScopeProductType = (scope) =>
  CAMPAIGN_SCOPE_TYPES[scope] || undefined;

export function productVariantTypes(product) {
  const types = new Set(
    (product?.variants || []).map((variant) => variant?.type),
  );
  return ["decant", "sealed"].filter((type) => types.has(type));
}

// Query params (without `page`) for GET /products in the picker.
export function buildProductPickerParams({ search, brandId, type, inStock } = {}) {
  const brand = normalizeEntityId(brandId);
  return {
    search: normalizeSearchText(search) || undefined,
    brandIds: brand ? [brand] : undefined,
    type: type === "sealed" || type === "decant" ? type : undefined,
    inStock: inStock === true ? true : undefined,
    availabilityFirst: false,
    sort: "newest",
    limit: PICKER_PAGE_SIZE,
  };
}

export function getNextProductPage(lastPage) {
  const page = Number(lastPage?.meta?.page);
  const totalPages = Number(lastPage?.meta?.totalPages);
  return Number.isInteger(page) && page >= 1 && page < totalPages
    ? page + 1
    : undefined;
}

/* ================= USERS ================= */

// Identification only: never totals, addresses or account internals.
export function toUserSnapshot(user) {
  const id = normalizeEntityId(user?.id);
  if (id === null) return null;
  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    null;
  return {
    id,
    fullName,
    phoneNumber: user.phoneNumber || null,
    email: user.email || null,
  };
}

export const couponUserSnapshots = (coupon) =>
  dedupeById((coupon?.allowedUsers || []).map(toUserSnapshot));

const PERSIAN_ZERO = 0x06f0;
const ARABIC_INDIC_ZERO = 0x0660;
// Separators typed or pasted inside numbers, including RTL direction marks.
const PHONE_SEPARATORS = /[\s\-()​-‏‪-‮⁦-⁩﻿]/g;

const toAsciiDigits = (value) =>
  value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO));

export const normalizeSearchText = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

// The subscriber digits a typed (possibly partial) mobile number shares with
// every stored form (989…, 09…, +989…), or null when not phone-like.
export function normalizePhoneSearch(value) {
  if (typeof value !== "string") return null;
  const phone = toAsciiDigits(value).replace(PHONE_SEPARATORS, "");
  if (!/^\+?\d+$/.test(phone)) return null;
  return phone.replace(/^\+/, "").replace(/^(?:0098|98|0)/, "") || null;
}

export function normalizeUserSearch(value) {
  const text = normalizeSearchText(value);
  return normalizePhoneSearch(text) ?? text;
}

// Only parameters GET /users/admin applies; no banned/verified filters.
export function buildUserPickerParams({ search } = {}) {
  return {
    search: normalizeUserSearch(search) || undefined,
    limit: PICKER_PAGE_SIZE,
  };
}

// A full page always carries a cursor; an empty page ends the list.
export const getNextUserCursor = (lastPage) =>
  lastPage?.data?.length && lastPage.nextCursor ? lastPage.nextCursor : undefined;

/* ================= PAYLOADS ================= */

export const toCampaignProductsPayload = (selection = []) =>
  normalizeIds(dedupeById(selection).map((item) => item.id)).map(
    (productId) => ({ productId }),
  );

export const toUserIdsPayload = (selection = []) =>
  normalizeIds(dedupeById(selection).map((item) => item.id));

export const COUPON_TARGETS = Object.freeze({
  ALL: "ALL",
  SELECTED_USERS: "SELECTED_USERS",
});

export const NOTIFICATION_TARGETS = Object.freeze({ ALL: "ALL", USER: "USER" });

// `userIds` is sent only with the specific-users target.
export function buildCouponTargetPayload({ target, selectedUsers } = {}) {
  return target === COUPON_TARGETS.SELECTED_USERS
    ? { target, userIds: toUserIdsPayload(selectedUsers) }
    : { target };
}

export function buildNotificationTargetPayload({ target, selectedUsers } = {}) {
  return target === NOTIFICATION_TARGETS.USER
    ? { target, userIds: toUserIdsPayload(selectedUsers) }
    : { target };
}
