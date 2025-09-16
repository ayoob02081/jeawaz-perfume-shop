import Backdrop from "@/ui/Backdrop";

function BackDropLogin({ children, toggleOpen }) {
  return (
    <Backdrop
      openForm="right-0 left-0 bottom-0"
      closeForm="-top-[200vh] hidden"
      className="flex max-md:items-end md:items-center justify-center max-md:pb-6 mx-auto w-screen bg-black/15 h-screen backdrop-blur-md overflow-hidden z-[60]"
      toggleOpen={toggleOpen}
    >
      <div className="flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] max-md:h-80 md:h-96 bg-white mx-auto rounded-3xl shadow-md">
        {children}
      </div>
    </Backdrop>
  );
}

export default BackDropLogin;
