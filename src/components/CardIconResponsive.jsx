import ImageFrame from "./ImageFrame";

function CardIconResponsive({
  size,
  className,
  hoverWidthMd,
  hoverWidthMaxMd,
  type,
}) {
  let bgColor;
  let src;
  let alt;
  let textStyle;
  let justify;
  let title;
  let dir;
  switch (type) {
    case "shirin":
      bgColor = "bg-orange/10";
      src = "/images/beach-icon.svg";
      alt = "beach-icon";
      textStyle = "text-orange";
      justify = "start";
      title = "رایحه شیرین";
      dir = "rtl";
      break;

    case "talkh":
      bgColor = "bg-dark-brown/10";
      src = "/images/frozen-icon.svg";
      alt = "frozen-icon";
      textStyle = "text-dark-brown";
      justify = "start";
      title = "رایحه شیرین";
      dir = "rtl";
      break;

    case "khonak":
      bgColor = "bg-success/10";
      src = "/images/dropwaters-icon.svg";
      alt = "dropwaters-icon";
      textStyle = "text-success";
      justify = "start";
      title = "رایحه شیرین";
      dir = "rtl";
      break;

    case "man":
      bgColor = "bg-grey";
      src = "/images/man-icon.svg";
      alt = "man-icon";
      justify = "end";
      title = "مردانه";
      dir = "ltr";
      break;

    case "woman":
      bgColor = "bg-grey";
      src = "/images/woman-icon.svg";
      alt = "woman-icon";
      justify = "end";
      title = "زنانه";
      dir = "ltr";
      break;

    default:
      break;
  }

  return (
    <div
      dir={dir}
      className={`flex items-center group rounded-[40px] px-2 md:hover:${hoverWidthMd} max-md:hover:${hoverWidthMaxMd} ${bgColor} ${className} duration-300`}
    >
      <ImageFrame
        src={src}
        alt={alt}
        className={`text-nowrap justify-${justify} ${size}`}
      />
      <p
        className={`w-0 opacity-0 group-hover:opacity-100 duration-200 group-hover:w-auto text-nowrap max-md:text-xs group-hover:pr-2 md:text-sm font-bold ${textStyle}`}
      >
        {title}
      </p>
    </div>
  );
}

export default CardIconResponsive;
