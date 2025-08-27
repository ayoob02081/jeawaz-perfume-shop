import ImageFrame from "./ImageFrame";

function CardIconResponsive({
  width,
  src,
  alt,
  className,
  title,
  hoverWidth,
  justify,
  textStyle,
  dir,
}) {
  return (
    <div
      dir={dir}
      className={`group duration-300 rounded-[40px] px-2 hover:${hoverWidth} ${className}`}
    >
      <ImageFrame
        src={src}
        alt={alt}
        className={`size-full text-nowrap justify-${justify}`}
        width={width}
      >
        <p
          className={`w-0 opacity-0 group-hover:opacity-100 duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm ${textStyle}`}
        >
          {title}
        </p>
      </ImageFrame>
    </div>
  );
}

export default CardIconResponsive;
