"use client";

import { useEffect, useRef, useState } from "react";

export function useHideOnScroll() {
  const [showElement, setShowElement] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setShowElement(true);
      } else if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
        setShowElement(currentScrollY < lastScrollY.current);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return showElement;
}
