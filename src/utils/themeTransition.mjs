// Run in <head>, before a streamed layout can paint. next-themes remains the
// state/storage owner after hydration; this only establishes the first frame.
export const THEME_BOOTSTRAP = `(()=>{let theme="light";try{const saved=localStorage.getItem("theme");if(saved==="dark")theme="dark";else if(saved&&saved!=="light")localStorage.setItem("theme","light")}catch{}const root=document.documentElement;root.classList.remove("light","dark","system");root.classList.add(theme);root.style.colorScheme=theme})()`;

// A single document-wide transition also coordinates header/sidebar toggles.
export async function transitionTheme(update, button) {
  const root = document.documentElement;
  if (root.hasAttribute("data-theme-transition")) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || document.visibilityState === "hidden" ||
      typeof document.startViewTransition !== "function" || typeof root.animate !== "function") {
    update();
    return;
  }

  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  let updated = false;
  const apply = () => {
    if (updated) return;
    update();
    updated = true;
  };

  root.setAttribute("data-theme-transition", "");
  try {
    const transition = document.startViewTransition(apply);
    // Attach rejection handlers immediately: ready can reject when a transition
    // is skipped (e.g. hidden tab) even though the theme update still succeeds.
    const finished = transition.finished.catch(() => {});
    try {
      await transition.ready;
      const animation = root.animate({
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
      }, {
        duration: 450,
        easing: "cubic-bezier(.22, 1, .36, 1)",
        pseudoElement: "::view-transition-new(root)",
      });
      await animation.finished.catch(() => {});
    } catch {
      // Skipped/unsupported pseudo-element animation: keep the normal update.
    }
    await finished;
  } catch {
    // Some engines expose the API but cannot start a transition in this state.
  } finally {
    try { apply(); } finally { root.removeAttribute("data-theme-transition"); }
  }
}
