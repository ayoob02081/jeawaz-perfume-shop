// Responsive variants of backend uploads. The backend stores, for each raster
// upload `/uploads/<name>`, WebP downscales at `/uploads/w1/<width>/<name>` and
// answers a missing one (not generated yet, or a tier at or above the
// original's width) with the original. Mirrors backend
// src/upload/image-variants.ts: change both together, with a new namespace.
export const VARIANT_NAMESPACE = "w1";
export const VARIANT_WIDTHS = [160, 320, 640, 960, 1280, 1920];

// One path segment of safe characters, never only dots (the backend grammar).
const SAFE_UPLOAD_NAME = /^(?!\.+$)[A-Za-z0-9_-][A-Za-z0-9._-]{0,254}$/;
// SVG and other formats have no variants.
const RASTER_UPLOAD = /\.(?:webp|png|jpe?g)$/i;

// The stored file name when `url` is a raster upload on `baseUrl`, else null.
export function rasterUploadName(url, baseUrl) {
  if (typeof url !== "string" || typeof baseUrl !== "string") return null;
  const prefix = `${baseUrl}/uploads/`;
  if (!url.startsWith(prefix)) return null;
  const name = url.slice(prefix.length);
  return SAFE_UPLOAD_NAME.test(name) && RASTER_UPLOAD.test(name) ? name : null;
}

// `srcset` over every tier for a raster upload, or null for any other source.
// The descriptors are the tier widths; a tier the original is narrower than
// returns the original, which is never wider than its descriptor.
export function uploadVariantSrcSet(url, baseUrl) {
  const name = rasterUploadName(url, baseUrl);
  if (!name) return null;
  return VARIANT_WIDTHS.map(
    (width) =>
      `${baseUrl}/uploads/${VARIANT_NAMESPACE}/${width}/${name} ${width}w`,
  ).join(", ");
}
