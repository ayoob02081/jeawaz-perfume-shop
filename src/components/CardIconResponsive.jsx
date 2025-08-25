import Image from "next/image";

function CardIconResponsive({ width, src, alt, className, children }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={width}
        objectFit="cover"
        quality={100}
      />
      {children}
    </div>
  );
}

export default CardIconResponsive;
