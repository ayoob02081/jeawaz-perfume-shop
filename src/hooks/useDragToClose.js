"use client";

import { useRef } from "react";

export function useDragToClose({ onClose, threshold = 120 }) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const lastTranslate = useRef(0);

  const onPointerDown = (e) => {
    if (e.pointerType !== "touch") return;

    const el = e.currentTarget;

    const scrollContainer = el.querySelector("[data-scroll]");
    if (scrollContainer && scrollContainer.scrollTop > 0) return;

    dragging.current = true;
    startY.current = e.clientY;

    el.setPointerCapture(e.pointerId);
    el.style.transition = "none";
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;

    const el = e.currentTarget;
    const delta = e.clientY - startY.current;

    if (delta < 0) return;

    lastTranslate.current = delta;

    el.style.willChange = "transform";
    el.style.transform = `translateY(${delta}px)`;
  };

  const onPointerUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;

    const el = e.currentTarget;

    el.style.transition =
      "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

    if (lastTranslate.current > threshold) {
      el.style.transform = "translateY(100vh)";
      setTimeout(onClose, 300);
    } else {
      el.style.transform = "translateY(0)";
      setTimeout(() => {
        el.style.transition = "";
      }, 400);
    }

    lastTranslate.current = 0;
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
