import { useEffect, useRef } from "react";

// Document click listener that calls `handler` for clicks outside the
// container. A disabled listener (e.g. a closed Modal, which stays mounted)
// must never fire: otherwise every click anywhere runs that component's close
// side effects.
export function createOutsideClickListener(getContainer, handler, enabled = true) {
  return (event) => {
    if (!enabled) return;
    const container = getContainer();
    if (container && !container.contains(event.target)) {
      handler();
    }
  };
}

export default function useOutsideClick(
  handler,
  listenCapturing = true,
  enabled = true,
) {
  const ref = useRef();

  useEffect(() => {
    if (!enabled) return undefined;
    const handleClick = createOutsideClickListener(() => ref.current, handler);
    document.addEventListener("click", handleClick, listenCapturing);

    return () => {
      document.removeEventListener("click", handleClick, listenCapturing);
    };
  }, [handler, listenCapturing, enabled]);

  return ref;
}
