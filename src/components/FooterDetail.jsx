import ImageFrame from "./ImageFrame";

function FooterDetail({
  src,
  alt,
  className,
  children,
  direction = "flex-row",
}) {
  return (
    <div
      className={`flex ${direction} items-center justify-between gap-4 h-16`}
    >
      <div className="relative bg-white p-4 rounded-full">
        <ImageFrame
          src={src}
          alt={alt}
          className={`relative ${className} z-50`}
        />
        <div className="absolute top-4 left-4 bg-primary/50 size-4 rounded-full"></div>
      </div>
      {children}
    </div>
  );
}

export default FooterDetail;
