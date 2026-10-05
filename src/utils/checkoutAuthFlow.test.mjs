// Checkout's in-place authentication (checkout/auth Phase 2B): the decisions
// are pure (checkoutAuthFlow.mjs); how CartLayout wires them is locked by
// bounded source checks, as the repository has no React DOM test runner.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cartSnapshot } from "./cartSnapshot.mjs";
import {
  CART_REVIEW_NOTICE,
  CHECKOUT_AUTH_REASON,
  decideAdvance,
  decideAuthClosed,
  decideResumeAfterAuth,
  decideSubmit,
  isAuthFailure,
} from "./checkoutAuthFlow.mjs";

const { GUEST_ADVANCE, SESSION_EXPIRED } = CHECKOUT_AUTH_REASON;

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const cartLayout = read("../app/(user)/cart/_components/CartLayout.jsx");
const cartSummary = read("../app/(user)/cart/_components/CartSummery.jsx");
const login = read("../app/(user)/auth/_components/Login.jsx");

// The body of `name` up to the next top-level declaration in that file.
const section = (source, start, end) => {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing ${end} after ${start}`);
  return source.slice(from, to);
};

const snapshot = (quantity, unitPrice = 100_000) =>
  cartSnapshot({
    items: [
      { product: { id: 1 }, mode: "sealed", volume: 100, quantity, unitPrice, lineTotal: unitPrice * quantity },
    ],
    itemsTotal: unitPrice * quantity,
    payableTotal: unitPrice * quantity,
    shippingCost: 0,
    totalProducts: quantity,
    totalPriceBeforeDiscount: unitPrice * quantity,
    discountAmount: 0,
    coupon: null,
  });

// --- decisions ---------------------------------------------------------------

test("a guest pressing continue on step 1 gets the login, not step 2", () => {
  assert.deepEqual(decideAdvance({ isAuthenticated: false }), {
    type: "OPEN_AUTH",
    reason: GUEST_ADVANCE,
  });
});

test("a signed-in shopper continues to step 2", () => {
  assert.deepEqual(decideAdvance({ isAuthenticated: true }), { type: "GO_TO_STEP", step: 2 });
});

test("closing the login: a guest stays on step 1, a lapsed checkout keeps its step", () => {
  assert.deepEqual(decideAuthClosed({ reason: GUEST_ADVANCE, step: 1 }), { step: 1 });
  assert.deepEqual(decideAuthClosed({ reason: SESSION_EXPIRED, step: 2 }), { step: 2 });
});

test("pay as a guest opens the login and submits nothing; a running checkout ignores a second press", () => {
  assert.deepEqual(decideSubmit({ isAuthenticated: false, isCheckingOut: false }), {
    type: "OPEN_AUTH",
    reason: SESSION_EXPIRED,
  });
  assert.deepEqual(decideSubmit({ isAuthenticated: true, isCheckingOut: true }), { type: "IGNORE" });
  assert.deepEqual(decideSubmit({ isAuthenticated: false, isCheckingOut: true }), { type: "IGNORE" });
  assert.deepEqual(decideSubmit({ isAuthenticated: true, isCheckingOut: false }), { type: "SUBMIT" });
});

test("after a login with an unchanged cart: a guest continues to step 2, a lapsed checkout stays on its step", () => {
  assert.deepEqual(
    decideResumeAfterAuth({ reason: GUEST_ADVANCE, step: 1, before: snapshot(2), after: snapshot(2) }),
    { step: 2, notice: null },
  );
  assert.deepEqual(
    decideResumeAfterAuth({ reason: SESSION_EXPIRED, step: 2, before: snapshot(2), after: snapshot(2) }),
    { step: 2, notice: null },
  );
});

test("after a login with a changed cart: step 1 with the review notice, for both reasons", () => {
  for (const [reason, step] of [
    [GUEST_ADVANCE, 1],
    [SESSION_EXPIRED, 2],
  ]) {
    for (const after of [snapshot(1), snapshot(3), snapshot(2, 120_000)]) {
      assert.deepEqual(
        decideResumeAfterAuth({ reason, step, before: snapshot(2), after }),
        { step: 1, notice: CART_REVIEW_NOTICE },
      );
    }
  }
});

test("an unknown (failed to load) or empty cart after login goes back to step 1 for review", () => {
  assert.deepEqual(
    decideResumeAfterAuth({ reason: GUEST_ADVANCE, step: 1, before: snapshot(2), after: null }),
    { step: 1, notice: CART_REVIEW_NOTICE },
  );
  const empty = cartSnapshot({ items: [], itemsTotal: 0, payableTotal: 0, totalProducts: 0 });
  assert.equal(
    decideResumeAfterAuth({ reason: SESSION_EXPIRED, step: 2, before: empty, after: empty }).step,
    1,
  );
});

test("a resume decision never asks for a submit: it is only a step and a notice", () => {
  for (const args of [
    { reason: GUEST_ADVANCE, step: 1, before: snapshot(2), after: snapshot(2) },
    { reason: SESSION_EXPIRED, step: 2, before: snapshot(2), after: snapshot(2) },
    { reason: SESSION_EXPIRED, step: 2, before: snapshot(2), after: snapshot(1) },
  ]) {
    assert.deepEqual(Object.keys(decideResumeAfterAuth(args)).sort(), ["notice", "step"]);
  }
});

test("only a 401 is an authentication failure", () => {
  assert.equal(isAuthFailure({ response: { status: 401 } }), true);
  for (const error of [{ response: { status: 400 } }, { response: { status: 500 } }, new Error("x"), undefined]) {
    assert.equal(isAuthFailure(error), false);
  }
});

test("the review notice is the agreed Persian text", () => {
  assert.equal(
    CART_REVIEW_NOTICE,
    "سبد خرید شما با حساب کاربری‌تان به‌روزرسانی شد. لطفاً قبل از ادامه آن را بررسی کنید.",
  );
});

// --- CartLayout wiring ----------------------------------------------------------

test("an auth re-check never replaces the checkout: only the first check or an unloaded cart shows the loader", () => {
  assert.match(cartLayout, /if \(initializing \|\| \(isLoading && !cart\)\) \{\s*return <Loading \/>;/);
  assert.doesNotMatch(cartLayout, /if \(loading \|\| isLoading\)/);
  assert.match(cartLayout, /const \{ initializing, isAuthenticated, sessionExpiredAt \} = useAuth\(\);/);
});

test("the login modal belongs to the mounted CartLayout and resumes through a callback, not the router", () => {
  const layout = section(cartLayout, "function CartLayout() {", "export default CartLayout;");
  assert.match(
    layout,
    /<Modal\s+isOpen=\{!!authPrompt\}\s+onClose=\{closeAuthPrompt\}[\s\S]*?<Login\s+closeBtn=\{true\}\s+onAuthenticated=\{handleAuthenticated\}\s+onClose=\{closeAuthPrompt\}\s*\/>/,
  );
  assert.doesNotMatch(layout, /router\.(push|replace|back)\(/);
  assert.doesNotMatch(layout, /\/auth\/login/);
  assert.match(login, /if \(onAuthenticated\) return onAuthenticated\(\);/);
  assert.match(login, /const close = onClose \?\? \(\(\) => router\.back\(\)\);/);
});

test("step 1's continue goes through the auth gate", () => {
  assert.match(cartLayout, /<CartOverview cart=\{cart\} onContinue=\{handleAdvance\} \/>/);
  assert.match(cartLayout, /<OrderSummaryCard cart=\{cart\} onContinue=\{onContinue\} \/>/);
  assert.match(cartSummary, /type="button"\s+onClick=\{onContinue\}/);
  assert.doesNotMatch(cartSummary, /setStep\(2\)/);
  const advance = section(cartLayout, "const handleAdvance = () => {", "const promptReauthentication");
  assert.match(advance, /decideAdvance\(\{ isAuthenticated \}\)/);
  assert.match(advance, /setAuthPrompt\(\{ reason: decision\.reason, before: cartSnapshot\(cart\) \}\);\s*return;/);
});

test("after login the cart is fetched anew and compared; nothing submits an order", () => {
  const resume = section(cartLayout, "const handleAuthenticated = async () => {", "const renderSteps");
  assert.match(resume, /await fetchFreshCart\(queryClient\)/);
  assert.match(resume, /decideResumeAfterAuth\(\{/);
  assert.match(resume, /after: cartSnapshot\(freshCart\)/);
  for (const forbidden of [/checkoutAndPay/, /onSubmit/, /handleSubmit/, /createOrder/, /createAddress/, /createPayment/]) {
    assert.doesNotMatch(resume, forbidden);
  }
});

test("the submit-time gate runs before any address, order or payment request", () => {
  const submit = section(cartLayout, "const onSubmit = async (data) => {", "const onError =");
  const gate = submit.indexOf("decideSubmit({ isAuthenticated, isCheckingOut })");
  assert.notEqual(gate, -1);
  for (const call of ["createAddress(", "checkoutAndPay(", "setIsCheckingOut(true)"]) {
    assert.ok(submit.indexOf(call) > gate, `${call} after the gate`);
  }
  assert.match(submit, /if \(decision\.type === "OPEN_AUTH"\) \{\s*onAuthRequired\(\);\s*return;\s*\}/);
  // The existing double-submit lock still comes first.
  assert.ok(submit.indexOf("if (isCheckingOut) return;") < gate);
});

test("a 401 from the address or order request opens the re-login instead of a generic toast", () => {
  const submit = section(cartLayout, "const onSubmit = async (data) => {", "const onError =");
  assert.match(submit, /if \(result\.stage === "order-failed" && isAuthFailure\(result\.error\)\) \{\s*onAuthRequired\(\);/);
  assert.match(submit, /catch \(err\) \{\s*if \(isAuthFailure\(err\)\) \{\s*onAuthRequired\(\);/);
  assert.match(cartLayout, /useCreateAddress\(\{\s*silentAuthErrors: true,\s*\}\)/);
  assert.match(cartLayout, /useCreateOrder\(\{ silentAuthErrors: true \}\)/);
});

test("a lapsed session on step 2 holds the signed-in cart and opens the prompt during render", () => {
  assert.match(cartLayout, /const cart = heldCart \?\? liveCart;/);
  assert.match(
    cartLayout,
    /if \(sessionExpiredAt !== seenSessionExpiry\) \{\s*setSeenSessionExpiry\(sessionExpiredAt\);\s*if \(step === 2 && liveCart && !heldCart && !authPrompt\) \{\s*setHeldCart\(liveCart\);/,
  );
});

test("the desktop back button inside the checkout form is not a submit button", () => {
  const summary = section(cartSummary, "export function CheckoutCartSummery", "function Details");
  assert.match(summary, /<button\s+type="button"\s+onClick=\{\(\) => setStep\(1\)\}/);
});

test("refetched addresses do not overwrite typed checkout fields", () => {
  assert.match(
    cartLayout,
    /if \(!selectedAddress \|\| filledAddressIdRef\.current === selectedAddress\.id\) \{\s*return;\s*\}\s*filledAddressIdRef\.current = selectedAddress\.id;/,
  );
});
