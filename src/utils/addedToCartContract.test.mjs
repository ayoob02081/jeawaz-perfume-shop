import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  CART_ROUTE,
  cartFromAddResponse,
  closeAddedItem,
  DESKTOP_MEDIA_QUERY,
  findAddedCartLine,
  findCartLine,
  resolveDecrement,
  resolveIncrement,
  initialAddedToCartState,
  isDesktopViewport,
  openAddedToCartSession,
  resolveAddSuccessFeedback,
  showAddedItem,
  toAddedCartItem,
} from "./addedToCartContract.mjs";
import { LIGHTBOX_MEDIA_QUERY } from "./imageSwiperContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const productPage = () => source("../app/(user)/products/_components/SingleProductPage.jsx");
const modalSource = () => source("../app/(user)/products/_components/AddedToCartModal.jsx");

const product = { id: 7, perTitle: "عطر نمونه", enTitle: "Sample", images: ["/uploads/a.webp", "/uploads/b.webp"] };
const line = (overrides = {}) => ({
  id: 1, product, mode: "decant", volume: 10, quantity: 1,
  unitPrice: 450_000, basePrice: 500_000, lineTotal: 450_000, ...overrides,
});
// POST /cart/item returns the whole cart: several lines of the same product.
const cart = {
  items: [
    line({ id: 1, volume: 5, unitPrice: 250_000, basePrice: 300_000 }),
    line({ id: 2, volume: 10, unitPrice: 450_000, basePrice: 500_000 }),
    line({ id: 3, mode: "sealed", volume: 10, unitPrice: 4_000_000, basePrice: 4_000_000 }),
    line({ id: 4, product: { ...product, id: 8, perTitle: "دیگری" }, volume: 10 }),
  ],
};

// A browser-like window: real EventTargets, so listener registration and
// removal behave as in the DOM.
function fakeWindow({ desktop = false } = {}) {
  const media = new EventTarget();
  media.matches = desktop;
  const win = new EventTarget();
  win.matchMedia = (query) => {
    assert.equal(query, DESKTOP_MEDIA_QUERY);
    return media;
  };
  win.setViewport = (isDesktop) => {
    media.matches = isDesktop;
    media.dispatchEvent(new Event("change"));
  };
  win.press = (key) => win.dispatchEvent(Object.assign(new Event("keydown"), { key }));
  return win;
}

test("the added line is matched by productId + mode + volume from the request", () => {
  assert.equal(findAddedCartLine(cart, { productId: 7, mode: "decant", volume: 10 }).id, 2);
  assert.equal(findAddedCartLine(cart, { productId: 7, mode: "sealed", volume: 10 }).id, 3);
  assert.equal(findAddedCartLine(cart, { productId: 7, mode: "decant", volume: 5 }).id, 1);
  assert.equal(findAddedCartLine(cart, { productId: 8, mode: "decant", volume: 10 }).id, 4);
  assert.equal(findAddedCartLine(cart, { productId: 7, mode: "decant", volume: 30 }), null);
  assert.equal(findAddedCartLine({}, { productId: 7, mode: "decant", volume: 10 }), null);
  assert.equal(findAddedCartLine(cart, undefined), null);
});

test("the modal item comes from the returned line; price is its unitPrice", () => {
  const item = toAddedCartItem(findAddedCartLine(cart, { productId: 7, mode: "decant", volume: 10 }));
  assert.deepEqual(item, {
    productId: 7,
    image: "/uploads/a.webp",
    title: "عطر نمونه",
    variantLabel: "دکانت ۱۰ میل",
    unitPrice: 450_000,
  });
  assert.equal(
    toAddedCartItem(findAddedCartLine(cart, { productId: 7, mode: "sealed", volume: 10 })).unitPrice,
    4_000_000,
  );
  // Nothing in the modal recalculates pricing.
  assert.doesNotMatch(modalSource(), /calculate\w*Price|offValue|discount/);
  // PriceSection gets the unit price as both prices, so no discount is shown.
  assert.match(modalSource(), /<PriceSection\s+unitPrice=\{item\.unitPrice\}\s+basePrice=\{item\.unitPrice\}/);
});

test("the returned request variables decide the item, not the page's current volume", () => {
  // The user switched to 5ml while the 10ml request was in flight.
  const feedback = resolveAddSuccessFeedback({
    cart,
    variables: { productId: 7, mode: "decant", volume: 10 },
    isDesktop: false,
  });
  assert.equal(feedback.item.variantLabel, "دکانت ۱۰ میل");
  assert.equal(feedback.item.unitPrice, 450_000);

  const handler = productPage().match(/const handleAdded = \(data, variables\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handler, "ProductDes defines handleAdded(data, variables)");
  assert.doesNotMatch(handler, /selectedVolume|activeMode|price\b/);
  assert.match(handler, /cart: data,\s*variables,/);
});

test("mobile success opens the modal; desktop success keeps the toast", () => {
  const variables = { productId: 7, mode: "decant", volume: 10 };
  assert.equal(resolveAddSuccessFeedback({ cart, variables, isDesktop: false }).kind, "modal");
  assert.deepEqual(resolveAddSuccessFeedback({ cart, variables, isDesktop: true }), { kind: "toast" });
});

test("a line that cannot be identified, or is incomplete, falls back to the toast", () => {
  const missing = { productId: 7, mode: "decant", volume: 30 };
  assert.deepEqual(resolveAddSuccessFeedback({ cart, variables: missing, isDesktop: false }), { kind: "toast" });
  const variables = { productId: 7, mode: "decant", volume: 10 };
  for (const broken of [
    { items: [line({ unitPrice: undefined })] },
    { items: [line({ unitPrice: "abc" })] },
    { items: [line({ product: { ...product, perTitle: "" } })] },
    { items: [line({ mode: "unknown" })] },
  ]) {
    const vars = { ...variables, mode: broken.items[0].mode };
    assert.deepEqual(resolveAddSuccessFeedback({ cart: broken, variables: vars, isDesktop: false }), { kind: "toast" });
  }
  assert.deepEqual(resolveAddSuccessFeedback({ cart: undefined, variables, isDesktop: false }), { kind: "toast" });
});

test("mobile is below the existing md (48rem) boundary", () => {
  assert.equal(DESKTOP_MEDIA_QUERY, "(min-width: 48rem)");
  assert.equal(DESKTOP_MEDIA_QUERY, LIGHTBOX_MEDIA_QUERY);
  assert.equal(isDesktopViewport(fakeWindow({ desktop: true })), true);
  assert.equal(isDesktopViewport(fakeWindow({ desktop: false })), false);
  // No matchMedia: never open the mobile-only modal.
  assert.equal(isDesktopViewport({}), true);
  assert.equal(isDesktopViewport(undefined), true);
});

test("a later success replaces the modal item instead of stacking", () => {
  const first = { title: "اول" };
  const second = { title: "دوم" };
  let state = showAddedItem(initialAddedToCartState, first);
  assert.deepEqual(state, { open: true, item: first, seq: 1 });
  state = showAddedItem(state, second);
  assert.deepEqual(state, { open: true, item: second, seq: 2 });
  // Closing keeps the item for the closing animation; reopening replaces it.
  state = closeAddedItem(state);
  assert.deepEqual(state, { open: false, item: second, seq: 2 });
  assert.equal(closeAddedItem(state), state);
  state = showAddedItem(state, first);
  assert.deepEqual(state, { open: true, item: first, seq: 3 });

  const page = productPage();
  assert.equal(page.match(/<AddedToCartModal\b/g)?.length, 1, "one modal instance");
  assert.match(page, /setAddedToCart\(\(state\) => showAddedItem\(state, feedback\.item\)\)/);
  // Focus is reset for each replacement.
  assert.match(modalSource(), /primaryRef\.current\?\.focus\([^)]*\);\s*\}, \[open, seq\]\)/);
});

test("Escape closes, and reaching desktop closes; cleanup removes both listeners", () => {
  const win = fakeWindow({ desktop: false });
  let closes = 0;
  const cleanup = openAddedToCartSession({ window: win, onClose: () => closes++ });
  assert.equal(closes, 0);
  win.press("Enter");
  assert.equal(closes, 0);
  win.press("Escape");
  assert.equal(closes, 1);
  win.setViewport(false);
  assert.equal(closes, 1);
  win.setViewport(true);
  assert.equal(closes, 2);
  cleanup();
  win.press("Escape");
  win.setViewport(false);
  win.setViewport(true);
  assert.equal(closes, 2);

  // Already on desktop when the session starts: closes immediately.
  let desktopCloses = 0;
  openAddedToCartSession({ window: fakeWindow({ desktop: true }), onClose: () => desktopCloses++ })();
  assert.equal(desktopCloses, 1);
});

test("the modal is not mounted on desktop and has dialog semantics", () => {
  const modal = modalSource();
  // No item is ever set on desktop, and without an item nothing (no Backdrop) renders.
  assert.match(modal, /if \(!item \|\| typeof document === "undefined"\) return null;/);
  assert.match(modal, /<Modal isOpen=\{open\} onClose=\{dismiss\}/);
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /aria-labelledby=\{headingId\}/);
  assert.match(modal, /<h2\s+id=\{headingId\}/);
  assert.match(modal, /محصول شما با موفقیت به سبد خرید اضافه شد!/);
  assert.match(modal, /ref=\{primaryRef\}[\s\S]*?onClick=\{onGoToCart\}[\s\S]*?رفتن به سبد خرید/);
  assert.match(modal, /onClick=\{dismiss\}[\s\S]*?ادامه خرید/);
  // Focus returns to the trigger on every close except "go to cart".
  assert.match(modal, /returnFocusRef\?\.current;\s*if \(target\?\.isConnected\) target\.focus/);
  assert.match(modal, /item\.image/);
  assert.match(modal, /item\.title/);
  assert.match(modal, /item\.variantLabel/);
  assert.match(modal, /unitPrice=\{item\.unitPrice\}/);
  // Shared Modal is reused unchanged: no history entries are created.
  assert.doesNotMatch(modal, /history\.|pushState|router/);
});

test("'go to cart' closes the modal and navigates to /cart", () => {
  assert.equal(CART_ROUTE, "/cart");
  const page = productPage();
  assert.match(page, /const goToCart = \(\) => \{\s*closeAddedToCart\(\);\s*router\.push\(CART_ROUTE\);\s*\};/);
  assert.match(page, /onGoToCart=\{goToCart\}/);
  assert.match(page, /returnFocusRef=\{addButtonRef\}/);
  assert.match(page, /ref=\{addButtonRef\}/);
});

test("useAddToCart hands success to onAdded, otherwise keeps the existing toast", () => {
  const cartHook = source("../hooks/useCart.js");
  assert.match(
    cartHook,
    /toast\.success\(data\?\.message \|\| "محصول به سبد خرید اضافه شد", \{\s*id: "add-cart-success",\s*\}\);/,
  );
  assert.match(
    cartHook,
    /if \(onAddedRef\.current\) onAddedRef\.current\(data, variables\);\s*else showAddToCartSuccessToast\(data\);\s*queryClient\.invalidateQueries/,
  );
  // The data layer holds no viewport or modal policy.
  assert.doesNotMatch(cartHook, /matchMedia|Modal|48rem|isDesktop/);
  // Desktop / fallback in the page use that same toast.
  assert.match(productPage(), /\} else \{\s*showAddToCartSuccessToast\(data\);\s*\}/);
});

test("quantity updates and errors keep their existing toasts", () => {
  const cartHook = source("../hooks/useCart.js");
  assert.match(
    cartHook,
    /mutationFn: updateQuantityApi,\s*onSuccess: \(data\) => \{\s*toast\.success\(data\?\.message \|\| "تعداد محصول بروزرسانی شد", \{\s*id: "update-cart-quantity-success",/,
  );
  assert.equal(cartHook.match(/onError: \(error\) => showApiError\(error\)/g)?.length, 5);

  const handler = source("../hooks/useQuantityHandler.js");
  // onAdded reaches only the new-line mutation.
  assert.match(handler, /const \{ addToCart \} = useAddToCart\(\{ onAdded \}\);/);
  assert.match(handler, /const \{ updateQuantity \} = useUpdateQuantity\(\);/);
  // "+" on a known line goes through updateQuantity (its toast), with rollback.
  assert.match(
    handler,
    /if \(action\.type === "update"\) \{\s*updateQuantity\(\s*\{ itemId: action\.itemId, quantity: action\.quantity \},\s*\{ onError \},\s*\);\s*\} else \{\s*addToCart\(action\.payload, \{ onError \}\);/,
  );
  assert.match(handler, /const onError = \(\) => setQuantity\(\(q\) => Math\.max\(0, q - 1\)\);/);
  // Cart page callers are unchanged (no onAdded, so the toast path is kept).
  const cartItems = source("../app/(user)/cart/_components/CartItemsLayout.jsx");
  assert.doesNotMatch(cartItems, /onAdded/);
});

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(jsx?|mjs)$/.test(entry.name) && !/\.test\.m?js$/.test(entry.name) ? [path] : [];
  });
}

test("exactly one <Toaster />, rendered by the root layout", () => {
  const srcRoot = new URL("../", import.meta.url);
  const hits = sourceFiles(srcRoot).flatMap((url) => {
    const text = readFileSync(url, "utf8");
    const relative = url.href.slice(srcRoot.href.length);
    return [
      ...(text.match(/<Toaster\b/g) ?? []).map(() => `render:${relative}`),
      ...(text.match(/import\s*\{[^}]*\bToaster\b[^}]*\}\s*from\s*"react-hot-toast"/g) ?? []).map(
        () => `import:${relative}`,
      ),
    ];
  });
  assert.deepEqual(hits.sort(), ["import:app/layout.jsx", "render:app/layout.jsx"]);
});

test("cart lines are identified by productId + mode + volume", () => {
  assert.equal(findCartLine(cart, { productId: 7, mode: "decant", volume: 10 }).id, 2);
  assert.equal(findCartLine(cart, { productId: 7, mode: "sealed", volume: 10 }).id, 3);
  assert.equal(findCartLine(cart, { productId: "7", mode: "decant", volume: "5" }).id, 1);
  assert.equal(findCartLine(cart, { productId: 7, mode: "sealed", volume: 5 }), null);
  assert.equal(findCartLine(cart, { productId: undefined, mode: "decant", volume: 10 }), null);
  assert.equal(findCartLine(undefined, { productId: 7, mode: "decant", volume: 10 }), null);
  assert.equal(findCartLine(cart), null);
});

test("only a full cart response can replace the cached cart", () => {
  assert.equal(cartFromAddResponse(cart), cart);
  assert.equal(cartFromAddResponse({ message: "ok" }), null);
  assert.equal(cartFromAddResponse(undefined), null);
});

test("'+' updates a known line; only an unknown line is added", () => {
  const request = { productId: 7, mode: "decant", volume: 10 };
  assert.deepEqual(resolveIncrement({ line: null, quantity: 0, request }), {
    type: "add",
    payload: { productId: 7, mode: "decant", volume: 10, quantity: 1 },
  });
  assert.deepEqual(resolveIncrement({ line: { id: 21 }, quantity: 1, request }), {
    type: "update", itemId: 21, quantity: 2,
  });
});

test("'-' updates above one, removes the last unit, and needs a known line", () => {
  assert.deepEqual(resolveDecrement({ line: { id: 21 }, quantity: 3 }), { type: "update", itemId: 21, quantity: 2 });
  assert.deepEqual(resolveDecrement({ line: { id: 21 }, quantity: 1 }), { type: "remove", itemId: 21 });
  assert.equal(resolveDecrement({ line: null, quantity: 1 }), null);
});

// Minimal model of Product Detail: useQuantityHandler reading the
// ["cart-items"] cache, and what useAddToCart does with the add response.
function productDetail({ selection, syncCacheOnAdd }) {
  const state = { cache: { items: [] }, quantity: 0 };
  const line = () => findCartLine(state.cache, selection);
  return {
    state,
    plus() {
      const action = resolveIncrement({ line: line(), quantity: state.quantity, request: selection });
      state.quantity += 1;
      return action;
    },
    minus() {
      const action = resolveDecrement({ line: line(), quantity: state.quantity });
      if (action) state.quantity = Math.max(0, state.quantity - 1);
      return action;
    },
    addSucceeded(response) {
      const synced = syncCacheOnAdd && cartFromAddResponse(response);
      if (synced) state.cache = synced;
    },
  };
}

for (const selection of [
  { productId: 7, mode: "decant", volume: 10 },
  { productId: 7, mode: "sealed", volume: 100 },
]) {
  test(`after the first ${selection.mode} add, '+' and '-' use the returned line at once`, () => {
    const addResponse = {
      items: [
        line({ id: 20, mode: "decant", volume: 5 }),
        line({ id: 21, mode: selection.mode, volume: selection.volume, quantity: 1 }),
      ],
    };

    const page = productDetail({ selection, syncCacheOnAdd: true });
    assert.equal(page.plus().type, "add");
    page.addSucceeded(addResponse);
    // No refetch has happened; the cached response already has the line.
    assert.deepEqual(page.plus(), { type: "update", itemId: 21, quantity: 2 });
    assert.deepEqual(page.minus(), { type: "update", itemId: 21, quantity: 1 });
    assert.deepEqual(page.minus(), { type: "remove", itemId: 21 });

    // Without the cache update (the previous behaviour) the line is unknown
    // until the refetch: '+' posts a second add and '-' does nothing.
    const stale = productDetail({ selection, syncCacheOnAdd: false });
    stale.plus();
    stale.addSucceeded(addResponse);
    assert.equal(stale.plus().type, "add");
    assert.equal(stale.minus(), null);
  });
}

test("useAddToCart caches the returned cart before feedback, on every viewport", () => {
  const cartHook = source("../hooks/useCart.js");
  const addHook = cartHook.match(/export function useAddToCart[\s\S]*?\n\}/)[0];
  assert.match(
    addHook,
    /const cart = cartFromAddResponse\(data\);\s*if \(cart\) queryClient\.setQueryData\(cartKeys\.items\(\), cart\);\s*if \(onAddedRef\.current\)/,
  );
  // The existing invalidation is kept; no extra request or refresh is added.
  assert.equal(addHook.match(/invalidateQueries/g)?.length, 1);
  assert.doesNotMatch(addHook, /\.refetch\w*\(|router\.|\.reload\(|setTimeout\(/);
  // Same key the product page reads.
  assert.match(cartHook, /queryKey: cartKeys\.items\(\),\s*queryFn: getAllCartItemsApi/);
  const handler = source("../hooks/useQuantityHandler.js");
  assert.match(handler, /const defaultCartItem = findCartLine\(cart, \{\s*productId: product\?\.id,\s*mode: volumeMode,\s*volume: selectedVolume,\s*\}\);/);
});

test("the modal is portaled to <body>, outside the translated product overlay", () => {
  // Why: on mobile Product Detail lives in this translated scroll container,
  // which is the containing block for any fixed descendant rendered inline.
  const overlay = source("../components/AdaptiveOverlayPage.jsx");
  const productBranch = overlay.match(/if \(product\) \{[\s\S]*?\n  \}/)[0];
  assert.match(productBranch, /translate-x-0/);
  assert.match(productBranch, /max-md:fixed/);
  assert.match(source("../app/(user)/products/[id]/layout.jsx"), /<AdaptiveOverlayPage[^>]*\bproduct\b/);

  const modal = modalSource();
  assert.match(modal, /import \{ createPortal \} from "react-dom";/);
  assert.match(modal, /return createPortal\(\s*<Modal[\s\S]*<\/Modal>,\s*document\.body,\s*\);/);
  assert.match(modal, /if \(!item \|\| typeof document === "undefined"\) return null;/);
  // The shared primitives are unchanged.
  assert.doesNotMatch(source("../components/Modal.jsx"), /createPortal/);
  assert.doesNotMatch(source("../ui/Backdrop.jsx"), /createPortal/);
});

test("closing leaves no active overlay, scroll lock or focusable content", () => {
  const closed = closeAddedItem(showAddedItem(initialAddedToCartState, { title: "x" }));
  assert.equal(closed.open, false);

  const modal = modalSource();
  // Modal/Backdrop follow `open`: outside-click listener off, body unlocked.
  assert.match(modal, /<Modal isOpen=\{open\} onClose=\{dismiss\}/);
  assert.match(modal, /inert=\{!open\}/);
  assert.match(source("../components/Modal.jsx"), /useOutsideClick\(onClose, true, isOpen\)/);
  // Backdrop holds the shared page lock only while open; closing or
  // unmounting releases it (bodyScrollLock.test.mjs covers the release).
  assert.match(source("../ui/Backdrop.jsx"), /useBodyScrollLock\(isOpen\);/);
  assert.match(
    source("../hooks/useBodyScrollLock.js"),
    /if \(!active\) return undefined;[\s\S]*return \(\) => unlockBodyScroll\(owner\);/,
  );
  // Escape / desktop listeners exist only while open (behaviour tested above).
  assert.match(modal, /if \(!open\) return undefined;\s*return openAddedToCartSession/);
});
