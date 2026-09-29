"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  initialImageSrc,
  nextImageSrcAfterError,
} from "@/utils/appImageSource.mjs";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(() =>
    initialImageSrc(src, fallbackSrc, BASE_URL),
  );

  useEffect(() => {
    setImgSrc(initialImageSrc(src, fallbackSrc, BASE_URL));
  }, [src, fallbackSrc]);

  const fitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  }[objectFit];

  // Without a loadable source only the sized container renders: no broken-image
  // icon, no request to a missing file, and the layout keeps its dimensions.
  return (
    <div
      className={`relative ${width} ${ratio} overflow-hidden ${className}`}
      {...(!imgSrc && alt ? { role: "img", "aria-label": alt } : {})}
    >
      {imgSrc && (
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
          onError={() =>
            setImgSrc((failed) =>
              nextImageSrcAfterError(failed, fallbackSrc, BASE_URL),
            )
          }
          {...rest}
        />
      )}
    </div>
  );
}
