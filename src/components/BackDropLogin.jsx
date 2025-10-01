import Backdrop from "@/ui/Backdrop";

function BackDropLogin({ children, toggleOpen }) {
  return (
    <Backdrop
      openForm="bottom-0 animate__fadeIn"
      closeForm="-top-[200vh] animate__fadeOut"
      className="flex max-md:items-end right-0 left-0 md:items-center justify-center max-md:pb-6 mx-auto w-full bg-black/15 h-screen backdrop-blur-md overflow-hidden z-[60] animate__animated "
      toggleOpen={toggleOpen}
    >
      <div className={`${toggleOpen ? "animate__fadeInUpBig" : "animate__fadeOutDownBig"}
      
      flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] max-md:h-80 md:h-96 bg-white rounded-3xl shadow-md animate__animated`}>
        {children}
      </div>
    </Backdrop>
  );
}

export default BackDropLogin;
