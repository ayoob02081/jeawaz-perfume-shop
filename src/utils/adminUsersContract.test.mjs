import test from "node:test";
import assert from "node:assert/strict";
import { parseAdminUsersQuery, nextAdminUsersSearch, userAccountStatus, canChangeUserBan } from "./adminUsersContract.mjs";

test("users URL state defaults, bounds and strict status filter", () => {
  const parse = (query) => parseAdminUsersQuery(new URLSearchParams(query));
  assert.deepEqual(parse(""), { page: 1, limit: 20, search: "" });
  assert.deepEqual(parse("page=2&limit=50&isBanned=false&search=+Ali+++Smith+"), { page: 2, limit: 50, search: "Ali Smith", isBanned: false });
  for (const value of ["-1", "0", "1.5", "1e3", "1000001", "oops"]) assert.equal(parse(`page=${value}`).page, 1);
  assert.equal(parse("limit=101&isBanned=invalid").isBanned, undefined);
  assert.equal(parse("limit=30").limit, 20);
  assert.equal(parse("isBanned=true").isBanned, true);
  assert.equal(parse("search=" + "a".repeat(300)).search.length, 200);
});

test("search/filter/page-size changes reset page and preserve other URL values", () => {
  const changed = new URLSearchParams(nextAdminUsersSearch("page=4&limit=50&search=old&isBanned=false&other=keep", { search: "new" }));
  assert.equal(changed.has("page"), false);
  assert.equal(changed.get("limit"), "50");
  assert.equal(changed.get("isBanned"), "false");
  assert.equal(changed.get("other"), "keep");
  assert.equal(changed.get("search"), "new");
  assert.equal(new URLSearchParams(nextAdminUsersSearch(changed, { page: 3 })).get("page"), "3");
  assert.equal(new URLSearchParams(nextAdminUsersSearch(changed, { isBanned: undefined })).has("isBanned"), false);
});

test("Back/Forward restores the entire management query from its URL", () => {
  const first = "page=2&search=ali&isBanned=false&limit=50";
  const second = nextAdminUsersSearch(first, { isBanned: true });
  const restored = parseAdminUsersQuery(new URLSearchParams(first));
  assert.deepEqual(restored, { page: 2, search: "ali", isBanned: false, limit: 50 });
  assert.equal(parseAdminUsersQuery(new URLSearchParams(second)).page, 1);
});

test("banned, verified and unverified users have distinct status labels", () => {
  assert.equal(userAccountStatus("banned"), "مسدود");
  assert.equal(userAccountStatus("verified"), "فعال — احراز شده");
  assert.equal(userAccountStatus("active"), "فعال — احراز نشده");
  assert.equal(userAccountStatus(undefined), "نامشخص");
});

test("UI prevents self and administrator ban actions", () => {
  assert.equal(canChangeUserBan({ id: 1, role: "user" }, 1), false);
  assert.equal(canChangeUserBan({ id: 2, role: "admin" }, 1), false);
  assert.equal(canChangeUserBan({ id: 2, role: "user" }, 1), true);
});
