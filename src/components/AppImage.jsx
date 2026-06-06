"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

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
  fallbackSrc = "/images/placeholder.png",
  ...rest
}) {
  const getCorrectSrc = (path) => {
    if (!path) return fallbackSrc;
    if (path.startsWith("http")) return path;
    if (path.startsWith("/uploads")) return `${BASE_URL}${path}`;
    return path;
  };

  const [imgSrc, setImgSrc] = useState(getCorrectSrc(src));

  useEffect(() => {
    setImgSrc(getCorrectSrc(src));
  }, [src]);

  const fitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down",
  }[objectFit];

  return (
    <div className={`relative ${width} ${ratio} overflow-hidden ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        unoptimized={imgSrc?.includes("/uploads")}
        className={fitClass}
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder="empty"
        onError={() => setImgSrc(fallbackSrc)}
        {...rest}
      />
    </div>
  );
}
