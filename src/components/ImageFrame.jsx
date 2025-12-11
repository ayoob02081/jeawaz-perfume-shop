import Image from "next/image";

function ImageFrame({
  src,
  alt,
  className,
  children,
  objectFit = "contain",
  objectPosition = "center",
  fill = true,
}) {
  return (
    <div
      className={`relative flex items-center justify-center p-2 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill={fill}
        style={{
          objectFit: `${objectFit}`,
          objectPosition: ` ${objectPosition}`,
        }}
      />
      {children}
    </div>
  );
}

export default ImageFrame;
