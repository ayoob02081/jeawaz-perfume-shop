"use client";

import { sessionLifecycle } from "@/utils/sessionLifecycle.mjs";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/auth/AuthContext";
import { FiltersContext } from "@/contexts/filters/context";
import { initialFilters } from "@/contexts/filters/initialStateFilters";
import { filtersReducer } from "@/contexts/filters/reducer";
import { SidebarProvider } from "@/contexts/Sidebars/SidebarContext";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import {
  applyIdentityChange,
  USER_SCOPED_QUERY_ROOTS,
  PRIVILEGED_QUERY_ROOTS,
} from "@/utils/authIdentityCache.mjs";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useReducer, useState } from "react";

function NotificationSocketBridge() {
  const { isAuthenticated, loading } = useAuth();

  useNotificationSocket(!loading && isAuthenticated);

  return null;
}

// Query keys do not encode the signed-in identity: when it changes (login,
// logout, session loss, another account), cached data of the previous one is
// reset and the cart is refetched for the new one.
function AuthQueryCacheBridge() {
  const queryClient = useQueryClient();
  useEffect(() => sessionLifecycle.subscribe((event) => {
    if (event.type === "invalidate") {
      const previous = sessionLifecycle.identity();
      return applyIdentityChange(queryClient, {
        reset: [...USER_SCOPED_QUERY_ROOTS, ...PRIVILEGED_QUERY_ROOTS],
        cart: previous == null ? "invalidate" : "reset",
      }, { refetch: false });
    }
    if (event.type === "ready" && event.changed) {
      for (const root of [...USER_SCOPED_QUERY_ROOTS, ...PRIVILEGED_QUERY_ROOTS, "cart-items"]) {
        void queryClient.invalidateQueries({ queryKey: [root] });
      }
    }
  }), [queryClient]);
  return null;
}

function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [state, dispatch] = useReducer(filtersReducer, initialFilters);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationSocketBridge />
        <AuthQueryCacheBridge />
        <ThemeProvider>
          <FiltersContext.Provider value={{ state, dispatch }}>
            <SidebarProvider>{children}</SidebarProvider>
          </FiltersContext.Provider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default Providers;
