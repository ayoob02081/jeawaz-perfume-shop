"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import {
  MoonIcon as MoonSolidIcon,
  SunIcon as SunSolidIcon,
} from "@heroicons/react/24/solid";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(dark ? "light" : "dark");
  };

  if (!mounted) {
    return <div className="w-12 h-6 rounded-full bg-stroke-200" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center bg-stroke-200 dark:bg-stroke-50 rounded-full px-1 py-0.5 w-12 h-6 duration-200 **:duration-200"
    >
      <div
        className={`absolute h-full aspect-square rounded-full shadow duration-200
        bg-gradient-to-r
        from-yellow-400 to-yellow-700
        dark:from-blue-700 dark:to-blue-950
        ${dark ? "right-0 -translate-x-full" : "right-0"}`}
      />

      <div className="relative z-10 flex items-center justify-between w-full">
        {dark ? (
          <SunIcon className="size-4 text-warning" />
        ) : (
          <SunSolidIcon className="size-4 text-white" />
        )}
      </div>

      <div className="text-stroke-800 z-10">
        {!dark ? (
          <MoonIcon className="size-4 text-blue-900" />
        ) : (
          <MoonSolidIcon className="size-4 text-white" />
        )}
      </div>
    </button>
  );
}
