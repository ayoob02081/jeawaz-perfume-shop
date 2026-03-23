import AppImage from "./AppImage";

function FooterDetail({
  src,
  className,
  direction = "flex-row",
  bg = "bg-stroke-0 dark:bg-stroke-800/20",
  items = "items-start",
  title,
  width,
  discription,
}) {
  return (
    <div
      className={`flex ${direction} items-center justify-between gap-4 h-16 min-w-3xs`}
    >
      <div className={`relative ${bg} p-4 rounded-full`}>
        <AppImage
          src={src}
          alt={title + "-آیکون"}
          className={`relative ${className} z-40`}
          width={width}
          sizes="10vw"
        />
        <div className="absolute top-4 left-4 bg-primary/50 size-4 rounded-full"></div>
      </div>
      <div className={`grow flex flex-col ${items} justify-between gap-1 `}>
        <p className="font-bold text-stroke-800">{title}</p>
        <p className="text-stroke-600 text-xs">{discription}</p>
      </div>
    </div>
  );
}

export default FooterDetail;
