"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

function Providers({ children }) {
  const [queryClient] = React.useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default Providers;
