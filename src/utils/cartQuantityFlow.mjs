// Quantity "+" / "-" on one cart line.
//
// Each change sends an absolute quantity computed from the count on screen.
// React Query v5 delivers a mutate() call's own callbacks only for the
// observer's latest call, so overlapping changes lost their rollbacks, and
// overlapping absolute quantities could reach the server in any order. A line
// therefore changes one request at a time, and after a rejection its count is
// taken from the re-read cart (useCart re-reads it before the change settles).
import { isSessionSuperseded } from "./sessionLifecycle.mjs";
import { findCartLine, resolveDecrement, resolveIncrement } from "./addedToCartContract.mjs";

// Mutations of one line run one at a time across every control showing it
// (React Query mutation scope); different lines stay independent.
export function cartLineScope({ productId, mode, volume } = {}) {
  if (productId == null || !mode || volume == null) return undefined;
  return `cart-line:${Number(productId)}:${mode}:${Number(volume)}`;
}

// The line's quantity on the server after a rejected change: from the
// re-read cart; without cart data, the quantity before the change.
export function settledLineQuantity(cart, line, fallback) {
  if (!Array.isArray(cart?.items)) return fallback;
  return Number(findCartLine(cart, line)?.quantity ?? 0);
}

// One control's change in flight; clicks meanwhile are ignored. Synchronous,
// so two clicks in the same frame cannot both start a change.
export function createLineGuard() {
  let pending = false;
  let scope;
  return {
    get pending() {
      return pending;
    },
    get scope() {
      return scope;
    },
    begin(changeScope) {
      if (pending) return false;
      pending = true;
      scope = changeScope;
      return true;
    },
    end() {
      pending = false;
    },
  };
}

// The scope a control's mutations are given on this render. React Query hands
// re-rendered options to a pending mutation, and one whose scope changed is
// never released from its old queue; so while a change is in flight the scope
// stays the one it started with (Product Detail can switch volume meanwhile).
export function lineScopeFor(guard, request) {
  return guard.pending ? guard.scope : cartLineScope(request);
}

export function createQuantityFlow({
  guard,
  quantity,
  setQuantity,
  line,
  request,
  readCart,
  add,
  update,
  remove,
  onRejected,
  onPendingChange,
}) {
  const start = () => {
    if (!guard.begin(cartLineScope(request))) return false;
    onPendingChange?.(true);
    return true;
  };
  const finish = (_data, error) => {
    if (isSessionSuperseded(error)) settle(0);
    guard.end();
    onPendingChange?.(false);
  };
  const settle = (fallback) =>
    setQuantity(settledLineQuantity(readCart(), request, fallback));

  return {
    increment() {
      if (!start()) return;
      const previous = quantity;
      const action = resolveIncrement({ line, quantity, request });
      // The error itself is already shown (useCart); `onRejected` lets the
      // page react to it.
      const options = {
        onError: (error) => {
          settle(previous);
          onRejected?.(error);
        },
        onSettled: finish,
      };
      if (action.type === "update") {
        update({ itemId: action.itemId, quantity: action.quantity }, options);
      } else {
        add(action.payload, options);
      }
      setQuantity((q) => q + 1);
    },

    async decrement() {
      const action = resolveDecrement({ line, quantity });
      if (!action || !start()) return;
      const previous = quantity;
      if (action.type === "update") {
        update(
          { itemId: action.itemId, quantity: action.quantity },
          { onError: () => settle(previous), onSettled: finish },
        );
        setQuantity((q) => Math.max(0, q - 1));
        return;
      }
      try {
        await remove(action.itemId);
        setQuantity((q) => Math.max(0, q - 1));
      } catch (error) {
        if (!isSessionSuperseded(error)) settle(previous);
      } finally {
        finish();
      }
    },
  };
}
