import Image from "next/image";

export default function AppImage({
  src,
  alt,
  className = "",
  ratio = "aspect-square",
  objectFit = "contain", // cover | contain | fill | none | scale-down
  sizes = "80vw",
  width = "w-full",
  ...rest
}) {
  // تبدیل objectFit به کلاس Tailwind
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
        src={src}
        alt={alt}
        fill
        className={fitClass}
        sizes={sizes}
        placeholder="empty"
        {...rest}
      />
    </div>
  );
}
