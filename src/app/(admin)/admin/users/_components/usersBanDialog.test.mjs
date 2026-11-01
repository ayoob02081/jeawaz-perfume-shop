import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { QueryClient, MutationObserver } from "@tanstack/react-query";
import { createSessionLifecycle } from "../../../../../utils/sessionLifecycle.mjs";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function load(relative, dependencies) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const { code } = transformSync(source, {
    filename: relative, module: { type: "commonjs" },
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
  });
  const exports = {};
  new Function("require", "exports", code)((name) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    assert.equal(name, "react/jsx-runtime", `unexpected dependency ${name}`);
    return require(name);
  }, exports);
  return exports;
}
// Controlled component hooks execute the real component callbacks/effects.
// This is a deterministic module-level interaction test, not a browser claim.
function runtime(effectsEnabled = true) {
  const slots = [], effects = [];
  let index = 0, dirty = false;
  const react = {
    createContext: () => ({ Provider: "Provider" }), useContext: () => null,
    useCallback: (fn) => fn, useMemo: (fn) => fn(),
    useRef(value) { const slot = index++; return slots[slot] ??= { current: value }; },
    useState(value) {
      const slot = index++;
      slots[slot] ??= { value: typeof value === "function" ? value() : value };
      return [slots[slot].value, (next) => {
        const value = typeof next === "function" ? next(slots[slot].value) : next;
        if (!Object.is(value, slots[slot].value)) { slots[slot].value = value; dirty = true; }
      }];
    },
    useEffect(fn, deps) {
      const slot = index++;
      if (!effectsEnabled) return;
      const old = slots[slot];
      if (!old || deps.some((dep, i) => !Object.is(dep, old.deps[i]))) {
        effects.push(() => { old?.cleanup?.(); slots[slot] = { deps, cleanup: fn() }; });
      }
    },
  };
  return {
    react,
    render(fn) {
      let tree;
      for (let attempt = 0; attempt < 10; attempt++) {
        index = 0; dirty = false; tree = fn();
        while (effects.length) effects.shift()();
        if (!dirty) return tree;
      }
      throw Error("unexpected render loop");
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
}
function find(node, predicate) {
  if (!node) return undefined;
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return find(node.props?.children, predicate);
}
const defaultExport = (value) => ({ __esModule: true, default: value });

function harness() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const lifecycle = createSessionLifecycle(); lifecycle.confirm(0, 1);
  const requests = [], invalidations = [], toasts = [];
  let requestStarted = deferred();
  client.invalidateQueries = async ({ queryKey }) => { invalidations.push(queryKey); };
  const hooks = load("../../../../../hooks/useUsers.js", {
    "@/services/usersServices": { setUserBanApi: (payload) => {
      const request = { ...deferred(), payload }; requests.push(request); requestStarted.resolve(); return request.promise;
    } },
    "@tanstack/react-query": { useMutation: (options) => options, useQueryClient: () => client },
    "next/navigation": {}, "react-hot-toast": {}, "@/contexts/auth/AuthContext": {},
    "@/utils/profileFormContract.mjs": {}, "@/utils/entityPickerContract.mjs": {},
    "@/utils/sessionLifecycle.mjs": { sessionLifecycle: lifecycle },
  });
  const observer = new MutationObserver(client, hooks.useSetUserBan());
  const component = runtime();
  let modal = runtime(false);
  const modalHooks = Object.fromEntries(Object.keys(modal.react).map((key) => [key, (...args) => modal.react[key](...args)]));
  const Modal = load("../../../../../components/Modal.jsx", {
    react: modalHooks, "@base-ui/react/dialog": { Dialog: { Root: "DialogRoot", Portal: "Portal", Popup: "Popup" } },
    "@/hooks/useDragToClose": { useDragToClose: () => ({ cancel() {} }) },
    "@/hooks/useOutsideClick": defaultExport(() => ({ current: null })),
    "@/ui/Backdrop": defaultExport("Backdrop"),
  }).default;
  const data = { data: [{ id: 2 }, { id: 3 }], meta: { total: 2, page: 1, totalPages: 1 } };
  const Layout = load("./UsersLayout.jsx", {
    "@/components/PagesNumber": defaultExport("PagesNumber"),
    react: component.react,
    "next/navigation": { useRouter: () => ({}), usePathname: () => "/admin/users", useSearchParams: () => new URLSearchParams() },
    "@/hooks/useUsers": { useAdminUsers: () => ({ data, isPending: false, isFetching: false }), useSetUserBan: () => ({
      mutateAsync: (vars) => observer.mutate(vars), isPending: observer.getCurrentResult().isPending,
    }) },
    "@/contexts/auth/AuthContext": { useAuth: () => ({ user: { id: 1, role: "admin" }, sessionReady: true }) },
    "@/utils/sessionLifecycle.mjs": { sessionLifecycle: lifecycle, isSessionSuperseded: (error) => error?.code === "ERR_SESSION_SUPERSEDED" },
    "@/utils/profileFormContract.mjs": { getSafeApiErrorMessage: (_error, fallback) => fallback },
    "@/utils/adminUsersContract.mjs": {
      ADMIN_USERS_LIMITS: [20, 50, 100], parseAdminUsersQuery: () => ({ page: 1, limit: 20, search: "" }),
    },
    "./UsersListTable": defaultExport("UsersListTable"),
    "@/components/Loading": defaultExport("Loading"), "@/components/Error": defaultExport("Error"),
    "@/components/NotExisted": defaultExport("NotExisted"), "@/components/Modal": defaultExport(Modal),
    "@/utils/toPersianNumbers": { toPersianNumbers: String },
    "react-hot-toast": defaultExport({ success: (message) => toasts.push(message) }),
  }).default;
  let tree;
  const render = () => tree = component.render(Layout);
  const dialog = () => find(tree, (node) => node.type === Modal);
  render();
  return {
    requests, invalidations, toasts, render, dialog,
    open(id = 2) {
      const table = find(tree, (node) => node.type === "UsersListTable");
      assert.equal(table.props.disabled, false);
      // Conditional rendering unmounts Modal on close; a new opening gets new refs.
      modal = runtime(false);
      table.props.onBan({ id, accountStatus: "verified", fullName: `Fixture ${id}` }); render();
    },
    submit() { return find(dialog().props.children, (node) => node.type === "button" && node.props.className.includes("btn--primary")).props.onClick(); },
    async started() { await requestStarted.promise; requestStarted = deferred(); render(); },
    dismiss(reason) {
      const actual = modal.render(() => Modal(dialog().props));
      find(actual, (node) => node.type === "DialogRoot").props.onOpenChange(false, { reason }); render();
    },
    error() { return find(dialog()?.props.children, (node) => node.props?.role === "alert"); },
    cleanup() { component.unmount(); client.clear(); },
  };
}

for (const reason of ["escape-key", "outside-press"]) {
  test(`${reason}: pending dismissal closes; late failure cannot restore dialog/error`, async () => {
    const h = harness();
    try {
      h.open(); const pending = h.submit(); await h.started(); h.dismiss(reason);
      assert.equal(h.dialog(), undefined);
      h.requests[0].reject(Error("synthetic failure")); await pending; h.render();
      assert.equal(h.dialog(), undefined); assert.deepEqual(h.toasts, []); assert.deepEqual(h.invalidations, []);
      h.open(); assert.ok(h.dialog()); assert.equal(h.error(), undefined);
      h.dismiss(reason); assert.equal(h.dialog(), undefined);
    } finally { h.cleanup(); }
  });
}
for (const successful of [true, false]) {
  test(`late ${successful ? "success" : "failure"} cannot modify a replacement opening`, async () => {
    const h = harness();
    try {
      h.open(); const old = h.submit(); await h.started(); h.dismiss("escape-key"); h.open(3);
      const replacement = h.dialog();
      if (successful) h.requests[0].resolve({ id: 2, isBanned: true }); else h.requests[0].reject(Error("synthetic failure"));
      await old; h.render();
      assert.ok(h.dialog()); assert.deepEqual(h.dialog().props.children[0].props.children, replacement.props.children[0].props.children);
      assert.equal(h.error(), undefined); assert.deepEqual(h.toasts, []);
      assert.equal(h.invalidations.length, successful ? 3 : 0);
      const fresh = h.submit(); await h.started(); assert.equal(h.requests[1].payload.id, 3);
      h.requests[1].resolve({ id: 3, isBanned: true }); await fresh; h.render();
      assert.equal(h.dialog(), undefined); assert.equal(h.toasts.length, 1);
    } finally { h.cleanup(); }
  });
}
test("same-turn duplicate clicks and replacement submissions never dispatch a second pending mutation", async () => {
  const h = harness();
  try {
    h.open(); const first = h.submit(), duplicate = h.submit(); await h.started();
    h.dismiss("outside-press"); h.open(3); await h.submit();
    assert.equal(h.requests.length, 1);
    h.requests[0].resolve({ id: 2, isBanned: true }); await Promise.all([first, duplicate]); h.render();
    assert.ok(h.dialog()); assert.equal(h.toasts.length, 0);
  } finally { h.cleanup(); }
});
test("current success closes once, shows success and refreshes user caches", async () => {
  const h = harness();
  try {
    h.open(); const pending = h.submit(); await h.started();
    h.requests[0].resolve({ id: 2, isBanned: true }); await pending; h.render();
    assert.equal(h.dialog(), undefined); assert.equal(h.toasts.length, 1);
    assert.deepEqual(h.invalidations, [["users"], ["user", "2"], ["user", 2]]);
  } finally { h.cleanup(); }
});
test("a current failure stays visible and retry succeeds without duplicate requests", async () => {
  const h = harness();
  try {
    h.open(); const pending = h.submit(); await h.started(); h.requests[0].reject(Error("synthetic failure"));
    await pending; h.render(); assert.ok(h.error()); assert.equal(h.toasts.length, 0);
    const retry = h.submit(); await h.started(); h.requests[1].resolve({ id: 2, isBanned: true });
    await retry; h.render(); assert.equal(h.dialog(), undefined); assert.equal(h.toasts.length, 1);
  } finally { h.cleanup(); }
});
