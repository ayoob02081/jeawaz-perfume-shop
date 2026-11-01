"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import {
  MoonIcon as MoonSolidIcon,
  SunIcon as SunSolidIcon,
} from "@heroicons/react/24/solid";
import { transitionTheme } from "@/utils/themeTransition.mjs";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [changing, setChanging] = useState(false);
  const [animate, setAnimate] = useState(false);
  const busy = useRef(false);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    setMounted(true);
    return () => {
      alive.current = false;
    };
  }, []);

  const dark = mounted && theme === "dark";
  const toggleTheme = async (event) => {
    if (!mounted || busy.current) return;
    busy.current = true;
    setChanging(true);
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    try {
      await transitionTheme(
        () =>
          flushSync(() => {
            if (alive.current) setAnimate(true);
            setTheme(next);
          }),
        event.currentTarget,
      );
    } finally {
      busy.current = false;
      if (alive.current) setChanging(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      disabled={!mounted || changing}
      onClick={toggleTheme}
      aria-label="حالت تاریک"
      data-dark={dark}
      data-mounted={mounted}
      data-animate={animate}
      className="theme-toggle relative inline-flex size-8 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span aria-hidden="true" className="relative size-6">
        <SunSolidIcon className="theme-toggle__icon theme-toggle__sun absolute inset-0 m-auto size-5.5 text-stroke-800 hover:text-amber-500 transition-all duration-200" />
        <MoonSolidIcon className="theme-toggle__icon theme-toggle__moon absolute inset-0 m-auto size-5 text-stroke-800 hover:text-blue-700 transition-all duration-200" />
      </span>
    </button>
  );
}
