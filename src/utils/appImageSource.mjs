// Image source contract for AppImage. There is no placeholder asset: when no
// source can be shown, AppImage keeps its sized container and renders no <img>,
// so there is no broken-image icon and no request to a missing file.

const STRINGIFIED_EMPTY = new Set(["undefined", "null"]);

// A loadable URL for next/image, or null when there is nothing to load
// (missing, blank, non-string, or a stringified undefined/null).
export function resolveImageSrc(path, baseUrl) {
  if (typeof path !== "string") return null;
  const value = path.trim();
  if (!value || STRINGIFIED_EMPTY.has(value)) return null;
  if (value.startsWith("http")) return value;
  if (value.startsWith("/uploads")) return `${baseUrl}${value}`;
  return value;
}

// The first source to show: the image, else the caller's fallback, else none.
export function initialImageSrc(src, fallbackSrc, baseUrl) {
  return resolveImageSrc(src, baseUrl) ?? resolveImageSrc(fallbackSrc, baseUrl);
}

// The source to show after `failedSrc` failed to load: the fallback once, then
// nothing. A URL that already failed is never retried, so onError cannot loop.
export function nextImageSrcAfterError(failedSrc, fallbackSrc, baseUrl) {
  const fallback = resolveImageSrc(fallbackSrc, baseUrl);
  return fallback && fallback !== failedSrc ? fallback : null;
}
