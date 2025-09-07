import Image from "next/image";

function ImageFrame({ src, alt, className, children }) {
  return (
    <div className={`relative flex items-center justify-center p-2 ${className}`}>
      <Image src={src} alt={alt} fill={true} style={{ objectFit: "contain" }} />
      {children}
    </div>
  );
}

export default ImageFrame;
