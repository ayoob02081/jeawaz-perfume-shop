import Backdrop from "@/ui/Backdrop";

function BackDropSidebar({ children, toggleOpen }) {
  return (
    <Backdrop
      openForm="right-0 left-0 md:w-full"
      closeForm="-right-[100vw] md:w-0"
      className="max-md:top-0 md:top-40 w-screen md:bg-black/15 h-svh max-md:bg-white md:backdrop-blur-md overflow-auto scrollbar-none "
      toggleOpen={toggleOpen}
    >
      <div className="md:bg-white md:max-w-xl md:mt-6 md:mr-6 md:rounded-3xl md:shadow-md md:flex md:items-center md:h-[30rem] md:justify-start">
        {children}
      </div>
    </Backdrop>
  );
}

export default BackDropSidebar;
