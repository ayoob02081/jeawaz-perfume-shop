import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { nextAdminUsersSearch, parseAdminUsersQuery, ADMIN_USERS_LIMITS } from "./adminUsersContract.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const react = {
  useMemo: (fn) => fn(), useCallback: (fn) => fn, useEffect() {},
  useRef: (value) => ({ current: value }), useState: (value) => [value, () => {}],
};
const defaultExport = (value) => ({ __esModule: true, default: value });
function load(file, dependencies) {
  const { code } = transformSync(readFileSync(new URL(file, import.meta.url), "utf8"), {
    filename: file, module: { type: "commonjs" },
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  });
  const exports = {};
  new Function("require", "exports", code)((name) => {
    if (name in dependencies) return dependencies[name];
    if (name === "react/jsx-runtime") return require(name);
    return defaultExport(name);
  }, exports);
  return exports.default;
}
const PagesNumber = load("../components/PagesNumber.jsx", {
  react,
  "@/utils/toPersianNumbers": { toPersianNumbers: String },
  "@heroicons/react/24/outline": { ArrowLeftIcon: "previous-icon", ArrowRightIcon: "next-icon" },
});
function find(node, predicate) {
  if (!node) return undefined;
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function fixture(search = "", totalPages = 10, options = {}) {
  let params = new URLSearchParams(search);
  const navigations = [], queries = [];
  const Layout = load("../app/(admin)/admin/users/_components/UsersLayout.jsx", {
    react,
    "next/navigation": {
      usePathname: () => "/admin/users", useSearchParams: () => params,
      useRouter: () => ({ push: (url, config) => navigations.push({ url, config }), replace() {} }),
    },
    "@/hooks/useUsers": {
      useAdminUsers: (query) => {
        queries.push(query);
        return { data: { data: [], meta: { totalPages } }, isPending: false, isFetching: false, ...options };
      },
      useSetUserBan: () => ({}),
    },
    "@/contexts/auth/AuthContext": { useAuth: () => ({ user: { id: 1, role: "admin" }, sessionReady: true }) },
    "@/utils/adminUsersContract.mjs": { nextAdminUsersSearch, parseAdminUsersQuery, ADMIN_USERS_LIMITS },
    "@/utils/toPersianNumbers": { toPersianNumbers: String },
    "@/components/PagesNumber": defaultExport(PagesNumber),
  });
  return {
    navigations, queries,
    render: () => Layout(),
    pagination() { const element = find(Layout(), (node) => node.type === PagesNumber); return element && PagesNumber(element.props); },
    url(value) { params = new URLSearchParams(value); },
  };
}
const buttons = (pagination) => pagination.props.children.flat().filter((node) => node?.type === "button");

test("first page disables previous; next preserves search, status, page size and URL options", () => {
  const f = fixture("search=QA&isBanned=false&limit=50");
  const controls = buttons(f.pagination());
  assert.equal(controls[0].props["aria-label"], "صفحه قبل");
  assert.equal(controls.at(-1).props["aria-label"], "صفحه بعد");
  assert.equal(controls[0].props.disabled, true);
  controls[0].props.onClick();
  assert.equal(f.navigations.length, 0);
  controls.at(-1).props.onClick();
  const next = new URL(f.navigations[0].url, "http://localhost");
  assert.equal(next.searchParams.get("page"), "2");
  assert.equal(next.searchParams.get("limit"), "50");
  assert.equal(next.searchParams.get("isBanned"), "false");
  assert.equal(next.searchParams.get("search"), "QA");
  assert.deepEqual(f.navigations[0].config, { scroll: false });
});
test("last page disables next and permits previous", () => {
  const f = fixture("page=10");
  const controls = buttons(f.pagination());
  assert.equal(controls.at(-1).props.disabled, true);
  controls.at(-1).props.onClick();
  assert.equal(f.navigations.length, 0);
  controls[0].props.onClick();
  assert.match(f.navigations[0].url, /page=9/);
});
test("numbered navigation reaches last page and current-page clicks are ignored", () => {
  const f = fixture("page=5");
  const controls = buttons(f.pagination());
  controls.find((node) => node.props.children === "5").props.onClick();
  assert.equal(f.navigations.length, 0);
  controls.find((node) => node.props.children === "10").props.onClick();
  assert.match(f.navigations[0].url, /page=10/);
});
test("returning to first page removes page=1 and preserves limit", () => {
  const f = fixture("page=2&limit=100");
  buttons(f.pagination())[0].props.onClick();
  assert.equal(f.navigations[0].url, "/admin/users?limit=100");
});
test("fetching disables every control and rejects queued/direct click handlers", () => {
  const f = fixture("page=5", 10, { isFetching: true });
  for (const button of buttons(f.pagination())) {
    assert.equal(button.props.disabled, true);
    button.props.onClick();
  }
  assert.equal(f.navigations.length, 0);
});
for (const count of [0, 1]) {
  test(`no pagination for ${count} total pages`, () => assert.equal(fixture("", count).pagination(), undefined));
}
test("failed and initial pending queries do not expose pagination", () => {
  assert.equal(fixture("", 10, { error: new Error("offline") }).pagination(), undefined);
  assert.equal(fixture("", 10, { data: undefined, isPending: true }).pagination(), undefined);
});
test("URL Back/Forward state is authoritative for current page and limit", () => {
  const f = fixture("page=3&limit=50");
  f.pagination();
  assert.equal(f.queries.at(-1).page, 3);
  f.url("page=2&limit=100");
  f.pagination();
  assert.equal(f.queries.at(-1).page, 2);
  assert.equal(f.queries.at(-1).limit, 100);
});
test("page-size selection resets page and retains the current filter", () => {
  const f = fixture("page=3&search=QA");
  const select = find(f.render(), (node) => node.type === "select" && node.props.value === 20);
  select.props.onChange({ target: { value: "50" } });
  assert.equal(f.navigations[0].url, "/admin/users?search=QA&limit=50");
});
