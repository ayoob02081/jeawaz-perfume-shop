"use client";

import ThemeProvider from "@/components/providers/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/auth/AuthContext";
import { FiltersContext } from "@/contexts/filters/context";
import { initialFilters } from "@/contexts/filters/initialStateFilters";
import { filtersReducer } from "@/contexts/filters/reducer";
import { SidebarProvider } from "@/contexts/Sidebars/SidebarContext";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import {
  applyIdentityChange,
  identityOf,
  planIdentityChange,
} from "@/utils/authIdentityCache.mjs";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useReducer, useRef, useState } from "react";

function NotificationSocketBridge() {
  const { isAuthenticated, loading } = useAuth();

  useNotificationSocket(!loading && isAuthenticated);

  return null;
}

// Query keys do not encode the signed-in identity: when it changes (login,
// logout, session loss, another account), cached data of the previous one is
// reset and the cart is refetched for the new one.
function AuthQueryCacheBridge() {
  const { user, initializing } = useAuth();
  const queryClient = useQueryClient();
  const identity = identityOf({ initializing, user });
  const previousIdentity = useRef(undefined);

  useEffect(() => {
    if (identity === undefined) return;
    const plan = planIdentityChange(previousIdentity.current, identity);
    previousIdentity.current = identity;
    applyIdentityChange(queryClient, plan);
  }, [identity, queryClient]);

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
