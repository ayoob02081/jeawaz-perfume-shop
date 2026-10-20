"use client";

import Image, { getImageProps } from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  initialImageState,
  nextImageStateAfterError,
} from "@/utils/appImageSource.mjs";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// `sizes` must describe the rendered width: for a raster upload it selects the
// downloaded variant. `responsive={false}` keeps the full-resolution original
// (gallery zoom). `priority` marks a critical above-the-fold image.
export default function AppImage({
  src,
  alt,
  className = "",
  ratio = "aspect-square",
  objectFit = "contain",
  sizes = "80vw",
  width = "w-full",
  priority = false,
  fallbackSrc = null,
  responsive = true,
  ...rest
}) {
  const [image, setImage] = useState(() =>
    initialImageState(src, fallbackSrc, BASE_URL, responsive),
  );
  const variantRef = useRef(null);

  useEffect(() => {
    setImage((current) => {
      const next = initialImageState(src, fallbackSrc, BASE_URL, responsive);
      return current.url === next.url && current.srcSet === next.srcSet
        ? current
        : next;
    });
  }, [src, fallbackSrc, responsive]);

  // Advances only from the state that failed, so a repeated error event for
  // the same image cannot skip the original or the fallback.
  const fail = (failed) =>
    setImage((current) =>
      current === failed
        ? nextImageStateAfterError(current, fallbackSrc, BASE_URL)
        : current,
    );

  // A server-rendered variant image that failed before hydration fired its
  // error with no handler attached.
  useEffect(() => {
    const img = variantRef.current;
    if (img?.complete && img.currentSrc && img.naturalWidth === 0) fail(image);
    // Mount only: later errors arrive through onError.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const imgSrc = image.url;
  const fitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  }[objectFit];

  let variantImage = null;
  if (imgSrc && image.srcSet) {
    const {
      props: { src: originalSrc, srcSet: _srcSet, sizes: _sizes, ...imgProps },
    } = getImageProps({
      src: imgSrc,
      alt,
      fill: true,
      unoptimized: true,
      className: fitClass,
      loading: priority ? "eager" : "lazy",
      ...(priority ? { fetchPriority: "high" } : {}),
      placeholder: "empty",
      ...rest,
    });
    // srcSet and sizes before src: a client-created <img> starts fetching
    // when src is set. src stays the original for non-srcset clients.
    variantImage = (
      <img
        {...imgProps}
        alt={alt}
        sizes={sizes}
        srcSet={image.srcSet}
        src={originalSrc}
        ref={variantRef}
        onError={() => fail(image)}
      />
    );
  }

  // Without a loadable source only the sized container renders: no broken-image
  // icon, no request to a missing file, and the layout keeps its dimensions.
  return (
    <div
      className={`relative ${width} ${ratio} overflow-hidden ${className}`}
      {...(!imgSrc && alt ? { role: "img", "aria-label": alt } : {})}
    >
      {variantImage ??
        (imgSrc && (
          <Image
            src={imgSrc}
            alt={alt}
            fill
            unoptimized={imgSrc.includes("/uploads")}
            className={fitClass}
            sizes={sizes}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            placeholder="empty"
            onError={() => fail(image)}
            {...rest}
          />
        ))}
    </div>
  );
}
