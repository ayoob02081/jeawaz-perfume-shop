// Identity changes and the React Query cache (checkout/auth Phase 2B). Keys
// do not encode the signed-in user, so on guest → user, user → guest and
// user A → user B the previous identity's data must disappear and the cart
// must be refetched. Uses a real QueryClient (the app's own dependency).
//
// Also covers the session-loss signal: a rejected refresh logs the app out
// once, a guest's failed refresh changes nothing.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  CART_QUERY_ROOT,
  PRIVILEGED_QUERY_ROOTS,
  USER_SCOPED_QUERY_ROOTS,
  applyIdentityChange,
  identityOf,
  planIdentityChange,
} from "./authIdentityCache.mjs";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  isDefinitiveRefreshFailure,
  notifySessionExpired,
  onSessionExpired,
} from "./authSessionEvents.mjs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

// A cache as user A left it: account data, admin data, a cart and public data.
function seededClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["addresses"], [{ id: 1, owner: "A" }]);
  client.setQueryData(["addresses", 1], { id: 1, owner: "A" });
  client.setQueryData(["orders", 1, 10, undefined], { data: ["A-order"] });
  client.setQueryData(["order", 9], { id: 9, owner: "A" });
  client.setQueryData(["notifications", "list", 1, 10], ["A-note"]);
  client.setQueryData(["admin-orders", "list", {}], ["all orders"]);
  client.setQueryData(["users"], ["everyone"]);
  client.setQueryData([CART_QUERY_ROOT], { items: ["A-cart-line"] });
  client.setQueryData(["products", "list", {}], ["public product"]);
  client.setQueryData(["get-categories"], ["public category"]);
  return client;
}

const accountDataLeft = (client) =>
  [
    ["addresses"],
    ["addresses", 1],
    ["orders", 1, 10, undefined],
    ["order", 9],
    ["notifications", "list", 1, 10],
    ["admin-orders", "list", {}],
    ["users"],
  ].filter((key) => client.getQueryData(key) !== undefined);

test("the first settled identity is the baseline; an unchanged identity does nothing", () => {
  assert.equal(identityOf({ initializing: true, user: { id: 1 } }), undefined);
  assert.equal(identityOf({ initializing: false, user: null }), null);
  assert.equal(identityOf({ initializing: false, user: { id: 7 } }), 7);

  assert.equal(planIdentityChange(undefined, 7), null);
  assert.equal(planIdentityChange(undefined, null), null);
  assert.equal(planIdentityChange(7, 7), null);
  assert.equal(planIdentityChange(null, null), null);
});

test("every identity change resets account and admin data", () => {
  for (const [previous, next] of [
    [null, 7],
    [7, null],
    [7, 8],
  ]) {
    assert.deepEqual(planIdentityChange(previous, next).reset, [
      ...USER_SCOPED_QUERY_ROOTS,
      ...PRIVILEGED_QUERY_ROOTS,
    ]);
  }
});

test("user → guest: account and admin data are gone at once, the user's cart is not reused, public data stays", () => {
  const client = seededClient();

  applyIdentityChange(client, planIdentityChange(7, null));

  assert.deepEqual(accountDataLeft(client), []);
  assert.equal(client.getQueryData([CART_QUERY_ROOT]), undefined);
  assert.deepEqual(client.getQueryData(["products", "list", {}]), ["public product"]);
  assert.deepEqual(client.getQueryData(["get-categories"]), ["public category"]);
});

test("user A → user B: nothing of A remains visible", () => {
  const client = seededClient();

  applyIdentityChange(client, planIdentityChange(7, 8));

  assert.deepEqual(accountDataLeft(client), []);
  assert.equal(client.getQueryData([CART_QUERY_ROOT]), undefined);
});

test("guest → user: the guest's own cart stays visible but is invalidated for the merged account cart", () => {
  const client = new QueryClient();
  client.setQueryData([CART_QUERY_ROOT], { items: ["guest line"] });

  applyIdentityChange(client, planIdentityChange(null, 7));

  assert.deepEqual(client.getQueryData([CART_QUERY_ROOT]), { items: ["guest line"] });
  assert.equal(client.getQueryState([CART_QUERY_ROOT]).isInvalidated, true);
});

test("an active, enabled query refetches for the new identity; a disabled one (guest addresses) does not", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const fetched = { cart: 0, addresses: 0 };
  const cart = new QueryObserver(client, {
    queryKey: [CART_QUERY_ROOT],
    queryFn: async () => ({ items: [`cart #${++fetched.cart}`] }),
  });
  const addresses = new QueryObserver(client, {
    queryKey: ["addresses"],
    queryFn: async () => [`address #${++fetched.addresses}`],
    enabled: false,
  });
  const stop = [cart.subscribe(() => {}), addresses.subscribe(() => {})];
  await client.refetchQueries({ queryKey: [CART_QUERY_ROOT] });
  const cartFetchesBefore = fetched.cart;

  applyIdentityChange(client, planIdentityChange(7, null));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await client.refetchQueries({ queryKey: [CART_QUERY_ROOT], type: "active" });

  assert.ok(fetched.cart > cartFetchesBefore, "the cart is fetched again for the guest");
  assert.equal(fetched.addresses, 0, "a guest never requests addresses");

  // Signed in on step 2: the address query becomes enabled and fetches.
  addresses.setOptions({
    queryKey: ["addresses"],
    queryFn: async () => [`address #${++fetched.addresses}`],
    enabled: true,
  });
  await client.refetchQueries({ queryKey: ["addresses"], type: "active" });
  assert.equal(fetched.addresses >= 1, true);
  stop.forEach((unsubscribe) => unsubscribe());
});

// --- session-loss signal -------------------------------------------------------

test("the session-loss signal is an event on the given target, with an unsubscribe", () => {
  const target = new EventTarget();
  const heard = [];
  const off = onSessionExpired(() => heard.push(AUTH_SESSION_EXPIRED_EVENT), target);

  notifySessionExpired(target);
  off();
  notifySessionExpired(target);

  assert.deepEqual(heard, [AUTH_SESSION_EXPIRED_EVENT]);
  assert.doesNotThrow(() => notifySessionExpired(null));
  assert.equal(typeof onSessionExpired(() => {}, null), "function");
});

test("only a 401 from the refresh is definitive", () => {
  assert.equal(isDefinitiveRefreshFailure({ response: { status: 401 } }), true);
  for (const error of [{ response: { status: 500 } }, { response: { status: 429 } }, new Error("offline")]) {
    assert.equal(isDefinitiveRefreshFailure(error), false);
  }
});

test("AuthProvider logs a signed-in user out on the signal, ignores it for a guest, and starts no request", () => {
  const source = read("../contexts/auth/AuthContext.jsx");
  const listener = source.slice(
    source.indexOf("onSessionExpired(() => {"),
    source.indexOf("[settle],", source.indexOf("onSessionExpired(() => {")),
  );

  assert.match(source, /import \{ onSessionExpired \} from "@\/utils\/authSessionEvents\.mjs";/);
  assert.match(
    listener,
    /if \(!userRef\.current\) return;\s*authGeneration\.current \+= 1;\s*userRef\.current = null;\s*setUser\(null\);\s*settle\(\);\s*setSessionExpiredAt\(Date\.now\(\)\);/,
  );
  for (const request of [/checkAuth\(/, /getUserApi\(/, /refresh/i, /logoutApi\(/]) {
    assert.doesNotMatch(listener, request);
  }
  assert.match(source, /initializing: !initialized,/);
  assert.match(source, /sessionExpiredAt,/);
});

test("the HTTP client signals only from the shared refresh, and stays free of React", () => {
  const source = read("../services/httpClient.js");
  assert.match(
    source,
    /\.post\("\/auth\/refresh"\)\s*\.catch\(\(refreshError\) => \{\s*if \(isDefinitiveRefreshFailure\(refreshError\)\) \{\s*notifySessionExpired\(\);\s*\}\s*throw refreshError;\s*\}\)/,
  );
  assert.doesNotMatch(source, /from "react"|AuthContext|useAuth/);
});

test("Providers applies identity changes inside the auth and query providers", () => {
  const source = read("../app/Providers.jsx");
  assert.match(
    source,
    /const identity = identityOf\(\{ initializing, user \}\);[\s\S]*?const plan = planIdentityChange\(previousIdentity\.current, identity\);\s*previousIdentity\.current = identity;\s*applyIdentityChange\(queryClient, plan\);/,
  );
  assert.match(
    source,
    /<QueryClientProvider client=\{queryClient\}>\s*<AuthProvider>\s*<NotificationSocketBridge \/>\s*<AuthQueryCacheBridge \/>/,
  );
});
