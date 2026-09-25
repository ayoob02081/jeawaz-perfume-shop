// Behaviour of the Product Detail ImageSwiper lightbox and thumbnail strip.

// The lightbox overlay is `max-md:hidden`; it may only be open while this matches.
export const LIGHTBOX_MEDIA_QUERY = "(min-width: 48rem)";

export function canOpenLightbox(imageCount, matchMedia) {
  return (
    imageCount > 0 &&
    typeof matchMedia === "function" &&
    matchMedia(LIGHTBOX_MEDIA_QUERY).matches
  );
}

// Global effects of an open lightbox: keyboard navigation, background scroll
// lock, and closing when the viewport drops below the lightbox breakpoint.
// Returns the cleanup that removes every listener and restores the body.
export function openLightboxSession({ window, onClose, onPrev, onNext }) {
  const { document } = window;
  const media = window.matchMedia(LIGHTBOX_MEDIA_QUERY);

  const onKeyDown = (event) => {
    if (event.key === "Escape") onClose();
    else if (event.key === "ArrowLeft") onPrev();
    else if (event.key === "ArrowRight") onNext();
  };
  const onMediaChange = () => {
    if (!media.matches) onClose();
  };

  const bodyStyle = document.body.style;
  const previous = {
    overflow: bodyStyle.overflow,
    paddingRight: bodyStyle.paddingRight,
  };
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  bodyStyle.overflow = "hidden";
  if (scrollbarWidth > 0) bodyStyle.paddingRight = `${scrollbarWidth}px`;

  window.addEventListener("keydown", onKeyDown);
  if (media.addEventListener) media.addEventListener("change", onMediaChange);
  else media.addListener?.(onMediaChange);
  onMediaChange();

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    if (media.removeEventListener) media.removeEventListener("change", onMediaChange);
    else media.removeListener?.(onMediaChange);
    bodyStyle.overflow = previous.overflow;
    bodyStyle.paddingRight = previous.paddingRight;
  };
}

// Visible area of an `object-contain` image inside its element box. Without
// intrinsic dimensions (not loaded yet, some SVGs) the whole box counts.
export function containedImageRect(box, naturalWidth, naturalHeight) {
  if (!(naturalWidth > 0 && naturalHeight > 0)) return box;
  const scale = Math.min(box.width / naturalWidth, box.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
    width,
    height,
  };
}

export function isPointOnContainedImage(box, naturalWidth, naturalHeight, x, y) {
  const rect = containedImageRect(box, naturalWidth, naturalHeight);
  return (
    x >= rect.left &&
    x <= rect.left + rect.width &&
    y >= rect.top &&
    y <= rect.top + rect.height
  );
}

// Scroll position that shows the selected thumbnail inside its own strip:
// start-aligned horizontally, nearest edge vertically (the previous
// scrollIntoView options), without scrolling the page or overlay around it.
export function thumbnailScrollTarget(strip, thumb) {
  const { rect } = strip;
  const left = strip.scrollLeft + (thumb.left - rect.left);
  let top = strip.scrollTop;
  if (thumb.top < rect.top) top += thumb.top - rect.top;
  else if (thumb.bottom > rect.bottom) top += thumb.bottom - rect.bottom;
  return { left, top };
}
