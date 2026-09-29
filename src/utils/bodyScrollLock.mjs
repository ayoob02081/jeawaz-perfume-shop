// One owner-counted lock for the page scroll behind overlays (Backdrop,
// SideBar). Each open overlay is an owner; the page stays locked until the
// LAST owner releases it, so one overlay closing never unlocks the page while
// another is still open (e.g. SideBar closing underneath CategorySidebar).
//
// The first lock snapshots the target's own overflow / paddingRight and
// compensates for the scrollbar it hides; the final unlock restores that
// snapshot exactly. Locking or unlocking the same owner twice is a no-op.

export function createScrollLock() {
  const owners = new Set();
  let snapshot = null;

  return {
    get ownerCount() {
      return owners.size;
    },

    // `measureScrollbar` is only called for the first owner.
    lock(owner, style, measureScrollbar = () => 0) {
      if (owners.has(owner)) return;
      owners.add(owner);
      if (owners.size > 1) return;

      snapshot = { overflow: style.overflow, paddingRight: style.paddingRight };
      style.overflow = "hidden";
      style.paddingRight = `${measureScrollbar()}px`;
    },

    unlock(owner, style) {
      if (!owners.delete(owner) || owners.size > 0 || !snapshot) return;

      style.overflow = snapshot.overflow;
      style.paddingRight = snapshot.paddingRight;
      snapshot = null;
    },
  };
}

// The page's lock, shared by every overlay.
const bodyLock = createScrollLock();

export function lockBodyScroll(owner, doc = globalThis.document, win = globalThis.window) {
  if (!doc?.body) return;
  bodyLock.lock(owner, doc.body.style, () =>
    Math.max(0, (win?.innerWidth ?? 0) - doc.documentElement.clientWidth),
  );
}

export function unlockBodyScroll(owner, doc = globalThis.document) {
  if (!doc?.body) return;
  bodyLock.unlock(owner, doc.body.style);
}

export const bodyScrollLockOwnerCount = () => bodyLock.ownerCount;
