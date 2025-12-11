import ImageFrame from "./ImageFrame";

function FooterDetail({
  src,
  alt,
  className,
  direction = "flex-row",
  bg = "bg-white",
  items = "items-start",
  title,
  discription,
}) {
  return (
    <div
      className={`flex ${direction} items-center justify-between gap-4 h-16 min-w-3xs`}
    >
      <div className={`relative ${bg} p-4 rounded-full`}>
        <ImageFrame
          src={src}
          alt={alt}
          className={`relative ${className} z-50`}
        />
        <div className="absolute top-4 left-4 bg-primary/50 size-4 rounded-full"></div>
      </div>
      <div className={`grow flex flex-col ${items} justify-between gap-1 `}>
        <p className="font-bold">{title}</p>
        <p className="text-text-secondary text-xs">{discription}</p>
      </div>
    </div>
  );
}

export default FooterDetail;
