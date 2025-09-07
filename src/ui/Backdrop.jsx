function Backdrop({ children, toggleOpen }) {
  return (
    <div
      className={`${
        toggleOpen
          ? "right-0 left-0 md:w-full"
          : "-right-[100vw] md:w-0 "
      } 
    absolute max-md:top-0 md:top-36 w-screen md:bg-black/15 h-svh max-md:bg-white md:backdrop-blur-md z-50 overflow-auto scrollbar-none max-md:duration-200`}
    >
      <div className="md:bg-white md:max-w-xl md:mt-6 md:mr-6 md:rounded-3xl md:shadow-md md:flex md:items-center md:h-[30rem] md:justify-start">
        {children}
      </div>
    </div>
  );
}

export default Backdrop;
