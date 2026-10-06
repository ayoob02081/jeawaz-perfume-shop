import { useEffect, useRef } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/utils/bodyScrollLock.mjs";

// Locks the page scroll while `active`, as one owner of the shared lock
// (utils/bodyScrollLock.mjs). Closing or unmounting releases only this
// component's ownership.
export default function useBodyScrollLock(active) {
  const ownerRef = useRef(null);
  if (!ownerRef.current) ownerRef.current = {};

  useEffect(() => {
    if (!active) return undefined;

    const owner = ownerRef.current;
    lockBodyScroll(owner);
    return () => unlockBodyScroll(owner);
  }, [active]);
}
