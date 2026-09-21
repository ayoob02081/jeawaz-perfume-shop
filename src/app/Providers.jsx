"use client";

import ThemeProvider from "@/components/providers/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/auth/AuthContext";
import { FiltersContext } from "@/contexts/filters/context";
import { initialFilters } from "@/contexts/filters/initialStateFilters";
import { filtersReducer } from "@/contexts/filters/reducer";
import { SidebarProvider } from "@/contexts/Sidebars/SidebarContext";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReducer, useState } from "react";

function NotificationSocketBridge() {
  const { isAuthenticated, loading } = useAuth();

  useNotificationSocket(!loading && isAuthenticated);

  return null;
}

function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [state, dispatch] = useReducer(filtersReducer, initialFilters);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationSocketBridge />
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
