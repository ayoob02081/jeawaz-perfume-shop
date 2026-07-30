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
  overflow,
  max = true,
  sidebar,
  cart,
  product,
  defaultStyle = "p-6",
  bgColor = "lg:bg-stroke-100 dark:lg:bg-stroke-50",
}) {
  if (sidebar) {
    return (
      <div
        className={`${isOpen ? "translate-x-0 right-0" : "translate-x-full"} top-0 size-fit 
       max-lg:fixed max-lg:w-screen max-lg:h-screen lg:shadow-xl lg:border lg:rounded-3xl
       bg-stroke-0 lg:bg-stroke-100 dark:lg:bg-stroke-50 border-stroke-200 max-lg:z-90 transition-all duration-200 ${overflow} max-md:bottom-20 md:bottom-0`}
      >
        <div className="flex flex-col h-full max-md:pb-6 w-full">
          <div
            className={`${justify === "between" && "w-full"} w-fit
            max-lg:flex lg:hidden items-center justify-center gap-2 pt-4 px-6 pb-4 border-b-2 border-stroke-200`}
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

  if (cart) {
    return (
      <div
        className={`relative  ${isOpen ? "right-0 translate-x-0" : "translate-x-full"} top-0 bg-stroke-0
           max-lg:fixed max-lg:w-screen max-lg:h-screen
         max-lg:z-90 duration-200 ${overflow} max-md:bottom-20 md:bottom-0`}
      >
        <div className="flex flex-col gap-4 h-fit bg-stroke-0 pb-10">
          <div
            className={` w-fit max-lg:flex lg:hidden
             items-center justify-center gap-2 pt-4 px-6`}
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

  if (product) {
    return (
      <div
        className={`${isOpen ? "translate-x-0 right-0" : "translate-x-full"} top-0 max-md:fixed max-md:w-full max-md:h-screen md:rounded-3xl bg-stroke-0 max-md:z-90 transition-all duration-200 ${overflow} max-md:bottom-20 md:bottom-0`}
      >
        <div className="flex flex-col h-full max-md:pb-6 w-full">
          <div
            className={`${justify === "between" && "w-full"} w-fit ${
              max ? "max-lg:flex lg:hidden" : "max-md:flex md:hidden"
            } items-center justify-center gap-2 pt-4 px-6`}
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
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isOpen ? "translate-x-0 right-0" : "translate-x-full"} top-0 ${sidebar ? "size-fit " : "w-full h-fit min-h-[50vh] overflow-hidden"} ${
        max
          ? "max-lg:fixed max-lg:w-screen max-lg:h-screen lg:shadow-xl lg:border lg:rounded-3xl"
          : "max-md:fixed max-md:w-full max-md:h-screen md:shadow-xl md:border md:rounded-3xl"
      } bg-stroke-0 ${bgColor} border-stroke-200 max-lg:z-90 transition-all duration-200 ${overflow} max-md:bottom-20 md:bottom-0`}
    >
      <div className="flex flex-col h-full max-md:pb-6 w-full">
        <div
          className={`${justify === "between" && "w-full"} w-fit ${
            max ? "max-lg:flex lg:hidden" : "max-md:flex md:hidden"
          } items-center justify-center gap-2 pt-4 px-6 pb-4 border-b-2 border-stroke-200`}
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
        <div className={defaultStyle}>{children}</div>
      </div>
    </div>
  );
}

export default AdaptiveOverlayPage;
