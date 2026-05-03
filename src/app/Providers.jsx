"use client";

import { AuthProvider } from "@/contexts/filters/auth/AuthContext";
import { FiltersContext } from "@/contexts/filters/context";
import { initialFilters } from "@/contexts/filters/initialStateFilters";
import { filtersReducer } from "@/contexts/filters/reducer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReducer, useState } from "react";

function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  const [state, dispatch] = useReducer(filtersReducer, initialFilters);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FiltersContext.Provider value={{ state, dispatch }}>
          {children}
        </FiltersContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default Providers;
