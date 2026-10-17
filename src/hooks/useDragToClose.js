"use client";

import { useCallback, useEffect, useRef } from "react";

export function useDragToClose({ onClose, onDismissStart, enabled = true, threshold = 120 }) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const lastTranslate = useRef(0);
  const closeTimer = useRef(null);
  const transitionTimer = useRef(null);
  const generation = useRef(0);
  const cancel = useCallback(() => {
    generation.current += 1;
    clearTimeout(closeTimer.current);
    clearTimeout(transitionTimer.current);
    closeTimer.current = null;
    transitionTimer.current = null;
    dragging.current = false;
    lastTranslate.current = 0;
  }, []);
  useEffect(() => {
    if (!enabled) cancel();
    return cancel;
  }, [enabled, cancel]);

  const onPointerDown = (e) => {
    if (!enabled || e.pointerType !== "touch" || closeTimer.current !== null) return;

    const el = e.currentTarget;

    const scrollContainer = el.querySelector("[data-scroll]");
    if (scrollContainer && scrollContainer.scrollTop > 0) return;

    cancel();
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
      el.style.transform = "translateY(100dvh)";
      onDismissStart?.();
      const captured = generation.current;
      closeTimer.current = setTimeout(() => {
        if (captured !== generation.current) return;
        closeTimer.current = null;
        onClose();
      }, 300);
    } else {
      el.style.transform = "translateY(0)";
      const captured = generation.current;
      transitionTimer.current = setTimeout(() => {
        if (captured !== generation.current) return;
        transitionTimer.current = null;
        el.style.transition = "";
      }, 400);
    }

    lastTranslate.current = 0;
  };

  return {
    cancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
