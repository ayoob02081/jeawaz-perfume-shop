import Backdrop from "@/ui/Backdrop";

function BackDropSidebar({ children, toggleOpen }) {
  return (
    <Backdrop
      openForm="right-0 left-0 animate__fadeIn"
      closeForm="-right-[100vw] animate__fadeOut"
      className="max-md:top-0 md:top-40 w-screen md:bg-black/15 h-svh max-md:bg-white md:backdrop-blur-md overflow-y-auto scrollbar-none animate__animated "
      toggleOpen={toggleOpen}
    >
      <div className={`${toggleOpen ? "animate__fadeInRightBig" : "animate__fadeOutRightBig"}
        md:bg-white md:max-w-xl md:mt-6 md:mr-6 md:rounded-3xl h-screen md:shadow-md md:flex md:items-center md:h-[30rem] md:justify-start animate__animated`}>
        {children}
      </div>
    </Backdrop>
  );
}

export default BackDropSidebar;
