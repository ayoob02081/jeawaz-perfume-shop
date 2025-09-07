import ImageFrame from "./ImageFrame";

function CardIconResponsive({
  size,
  src,
  alt,
  className,
  title,
  hoverWidthMd,
  hoverWidthMaxMd,
  justify,
  textStyle,
  dir,
}) {
  return (
    <div
      dir={dir}
      className={`flex items-center group rounded-[40px] px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} bg-secondary ${className} duration-300`}
    >
      <ImageFrame
        src={src}
        alt={alt}
        className={`text-nowrap justify-${justify} ${size}`}
      />
        <p
          className={`w-0 opacity-0 group-hover:opacity-100 duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm ${textStyle}`}
        >
          {title}
        </p>
    </div>
  );
}

export default CardIconResponsive;
