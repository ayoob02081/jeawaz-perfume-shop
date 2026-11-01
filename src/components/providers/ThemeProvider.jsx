"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

// Older visits may have persisted "system". Map it to light in the pre-paint
// script too, then migrate the preference without following OS changes.
const themeValues = { light: "light", dark: "dark", system: "light" };

function ExplicitThemePreference() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (theme !== "light" && theme !== "dark") setTheme("light");
  }, [theme, setTheme]);
  return null;
}

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      value={themeValues}
      disableTransitionOnChange
    >
      <ExplicitThemePreference />
      {children}
    </NextThemesProvider>
  );
}
