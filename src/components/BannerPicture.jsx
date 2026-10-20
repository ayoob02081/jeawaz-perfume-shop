"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { artDirectedImageSources } from "@/utils/appImageSource.mjs";
import { uploadVariantSrcSet } from "@/utils/imageVariants.mjs";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
// The desktop art from 30rem up: the same switch as the previous
// max-[30rem]:hidden / max-[30rem]:block pair of images.
const DESKTOP_MEDIA = "(min-width: 30rem)";

// A banner's desktop and mobile art in one <picture>, so the browser downloads
// only the source for the current viewport; two CSS-hidden eager images both
// download (and React preloads both). Box, fit and missing/failed-source
// behaviour match AppImage. `priority` marks the LCP image: eager and
// fetchpriority=high in the server HTML. No preload link: it cannot follow
// the <source> media, so it would fetch the wrong art on one of the viewports.
export default function BannerPicture({
  src,
  mobileSrc,
  alt,
  sizes,
  mobileSizes,
  priority = false,
}) {
  const [failed, setFailed] = useState(() => new Set());
  // Raster uploads whose variants failed: shown once more as the plain original.
  const [plain, setPlain] = useState(() => new Set());
  const { desktop, mobile } = artDirectedImageSources(src, mobileSrc, BASE_URL, failed);
  const imageSrc = mobile ?? desktop;
  const variantsOf = (url) =>
    plain.has(url) ? null : uploadVariantSrcSet(url, BASE_URL);

  const propsFor = (url, imageSizes) => {
    const props = getImageProps({
      src: url,
      alt,
      fill: true,
      sizes: imageSizes,
      unoptimized: url.includes("/uploads"),
      className: "object-cover",
      loading: priority ? "eager" : "lazy",
      ...(priority ? { fetchPriority: "high" } : {}),
    }).props;
    const variants = variantsOf(url);
    if (!variants) return props;
    // srcSet and sizes before src, as next/image orders them.
    const { src: original, srcSet: _srcSet, sizes: _sizes, ...rest } = props;
    return { ...rest, sizes: imageSizes, srcSet: variants, src: original };
  };

  // The failed source is the one the <picture> selected for this viewport:
  // its variants fall back to the original once, then the box only.
  const fail = () => {
    const url = desktop && mobile
      ? (window.matchMedia(DESKTOP_MEDIA).matches ? desktop : mobile)
      : imageSrc;
    if (variantsOf(url)) {
      setPlain((previous) => new Set(previous).add(url));
    } else {
      setFailed((previous) => new Set(previous).add(url));
    }
  };
  // An image that failed before hydration fired its error with no handler.
  // Checked once on mount: after a fallback re-render the previous request
  // still reads as broken until the new source starts loading.
  const imgRef = useRef(null);
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.currentSrc && img.naturalWidth === 0) fail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const imgProps = imageSrc && propsFor(imageSrc, mobile ? mobileSizes : sizes);
  const desktopSource = desktop && mobile && propsFor(desktop, sizes);
  // A viewport without a source shows only the box, as AppImage does.
  const hiddenOn = !mobile ? "max-[30rem]:hidden" : !desktop ? "min-[30rem]:hidden" : "";

  return (
    <div className="relative size-full aspect-square overflow-hidden">
      {imgProps && (
        <picture>
          {desktopSource && (
            <source
              media={DESKTOP_MEDIA}
              srcSet={desktopSource.srcSet ?? desktopSource.src}
              sizes={desktopSource.sizes}
            />
          )}
          <img
            {...imgProps}
            alt={alt}
            className={[imgProps.className, hiddenOn].filter(Boolean).join(" ")}
            ref={imgRef}
            onError={fail}
          />
        </picture>
      )}
      {!desktop && alt && (
        <span role="img" aria-label={alt} className="absolute inset-0 max-[30rem]:hidden" />
      )}
      {!mobile && alt && (
        <span role="img" aria-label={alt} className="absolute inset-0 min-[30rem]:hidden" />
      )}
    </div>
  );
}
