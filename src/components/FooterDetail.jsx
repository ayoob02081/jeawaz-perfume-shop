import ImageFrame from "./ImageFrame";

function FooterDetail({ src, alt, className, title, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 h-16">
      <div className="relative bg-white p-4 rounded-full">
        <ImageFrame
          src={src}
          alt={alt}
          className={`relative ${className} z-50`}
        />
        <div className="absolute top-4 left-4 bg-primary/50 size-4 rounded-full"></div>
      </div>
      <div className="grow flex flex-col items-start justify-between gap-1 ">
        <p className="font-bold">{title}</p>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default FooterDetail;
