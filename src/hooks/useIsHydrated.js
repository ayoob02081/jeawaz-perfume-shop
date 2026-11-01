import { useSyncExternalStore } from "react";

// Nothing to subscribe to: the value only changes once, when hydration ends.
const emptySubscribe = () => () => {};

// false on the server and during the hydration render, true afterwards (and
// immediately on client-only renders). Use it to keep the first hydration
// render identical to the server HTML when it depends on client-only state,
// such as a React Query cache that another subtree may have already filled.
export function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
