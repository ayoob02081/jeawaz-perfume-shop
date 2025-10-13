import GoBack from "@/ui/GoBack";

function AdaptiveOverlayPage({
  isOpen,
  children,
  className,
  label,
  side,
  onClick,
  fontStyle,
  justify,
  max,
  min,
}) {
  return (
    <div
      className={`${isOpen ? "right-0" : "-right-[100vw]"} ${
        max === "true" ? "max-lg:fixed" : "max-md:fixed"
      } top-0 bg-white ${
        max === "true" ? "max-lg:w-screen" : "max-md:w-screen"
      } max-lg:w-full lg:w-fit ${
        max === "true" ? "max-lg:h-screen" : "max-md:h-screen"
      } max-lg:z-[60] duration-200 ${
        max === "true" ? "max-lg:pt-6" : "max-md:pt-6"
      } ${
        max === "true" ? "max-lg:overflow-y-auto" : "max-md:overflow-y-auto"
      } max-md:bottom-20 md:bottom-0`}
    >
      <div className="flex flex-col gap-4 h-fit bg-white max-md:pb-28 md:pb-10">
        <div
          className={`${justify === "between" && "w-full"} w-fit ${
            max === "true" ? "max-lg:flex" : "max-md:flex"
          } ${
            min === "true" ? "lg:hidden" : "md:hidden"
          } items-center justify-center gap-2 p-6`}
        >
          <GoBack
            onClick={onClick}
            label={label}
            side={side}
            className={className}
            fontStyle={fontStyle}
            justify={justify}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export default AdaptiveOverlayPage;
