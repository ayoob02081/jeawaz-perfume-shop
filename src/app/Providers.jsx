"use client";

import ThemeProvider from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import { FiltersContext } from "@/contexts/filters/context";
import { initialFilters } from "@/contexts/filters/initialStateFilters";
import { filtersReducer } from "@/contexts/filters/reducer";
import { SidebarProvider } from "@/contexts/Sidebars/SidebarContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReducer, useState } from "react";

function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [state, dispatch] = useReducer(filtersReducer, initialFilters);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
