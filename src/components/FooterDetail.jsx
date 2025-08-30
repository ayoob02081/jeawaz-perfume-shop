import Image from "next/image";
import ImageFrame from "./ImageFrame";

function FooterDetail({ src, alt, className, width, title, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 h-16">
      <div className="relative bg-white p-4 rounded-full">
        <ImageFrame
          src={src}
          alt={alt}
          className={`relative ${className} z-50`}
          width={width}
        ></ImageFrame>
        <div className="absolute top-4 left-4 bg-red-400 size-4 rounded-full"></div>
      </div>
      <div className="grow flex flex-col items-start justify-between gap-1 ">
        <p className="font-bold">{title}</p>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default FooterDetail;
