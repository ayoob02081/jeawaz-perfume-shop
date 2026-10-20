// Image source contract for AppImage. There is no placeholder asset: when no
// source can be shown, AppImage keeps its sized container and renders no <img>,
// so there is no broken-image icon and no request to a missing file.

import { uploadVariantSrcSet } from "./imageVariants.mjs";

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

// AppImage's source with its responsive variants. A raster upload starts with
// its variant srcset when `responsive`; any error then drops to the plain
// original once, and only a failing original moves on to the fallback rules
// above. Every other source behaves exactly as before.
export function initialImageState(src, fallbackSrc, baseUrl, responsive = true) {
  const url = initialImageSrc(src, fallbackSrc, baseUrl);
  return {
    url,
    srcSet: responsive ? uploadVariantSrcSet(url, baseUrl) : null,
  };
}

export function nextImageStateAfterError(state, fallbackSrc, baseUrl) {
  if (state.srcSet) return { url: state.url, srcSet: null };
  return {
    url: nextImageSrcAfterError(state.url, fallbackSrc, baseUrl),
    srcSet: null,
  };
}

// Desktop and mobile sources of one art-directed <picture>. Each viewport keeps
// the rules above without a fallback: a missing, unloadable or already-failed
// source (`failed` holds resolved URLs) leaves that viewport only the sized box.
export function artDirectedImageSources(src, mobileSrc, baseUrl, failed = new Set()) {
  const usable = (path) => {
    const url = resolveImageSrc(path, baseUrl);
    return url && !failed.has(url) ? url : null;
  };
  return { desktop: usable(src), mobile: usable(mobileSrc) };
}
