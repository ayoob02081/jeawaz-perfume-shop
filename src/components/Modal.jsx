import useOutsideClick from "@/hooks/useOutsideClick";
import Backdrop from "@/ui/Backdrop";

function Modal({ children, toggleOpen, onClose, login, signin, category }) {
  const ref = useOutsideClick(onClose);

  const loginModalStyle = {
    openForm: "transform bottom-0 animate__fadeIn",
    closeForm: "transform translate-y-[100vh] animate__fadeOut cursor-none",
    className:
      "flex max-md:items-end right-0 left-0 md:items-center justify-center max-md:pb-6 mx-auto w-full bg-black/15 h-screen backdrop-blur-md overflow-hidden z-[60] animate__animated ",
    toggleOpen: "animate__fadeInUpBig",
    toggleClose: "animate__fadeOutDownBig",
    modalClassName:
      "flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] max-md:h-80 md:h-96 bg-white rounded-3xl shadow-md animate__animated",
  };

  const signinModalStyle = {
    openForm: "transform bottom-0 animate__fadeIn",
    closeForm: "transform translate-y-[100vh] animate__fadeOut cursor-none",
    className:
      "flex max-md:items-end right-0 left-0 md:items-center justify-center max-md:pb-6 mx-auto w-full bg-black/15 h-screen backdrop-blur-md overflow-hidden z-[60] animate__animated ",
    toggleOpen: "animate__fadeInUpBig",
    toggleClose: "animate__fadeOutDownBig",
    modalClassName:
      "flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] bg-white rounded-3xl shadow-md animate__animated",
  };

  const categoryModalStyle = {
    openForm: " animate__fadeIn",
    closeForm: "transform translate-x-[100vw] animate__fadeOut cursor-none",
    className:
      "max-md:top-0 md:top-40 right-0 left-0 w-screen md:bg-black/15 h-svh max-md:bg-white md:backdrop-blur-md overflow-y-auto scrollbar-none animate__animated ",
    toggleOpen: " animate__fadeInRightBig",
    toggleClose: "animate__fadeOutRightBig",
    modalClassName:
      "md:bg-white md:max-w-xl md:mt-6 md:mr-6 md:rounded-3xl h-screen md:shadow-md md:flex md:items-center md:h-[30rem] md:justify-start animate__animated",
  };

  return (
    <Backdrop
      openForm={
        (category && categoryModalStyle.openForm) ||
        (login && loginModalStyle.openForm) ||
        (signin && signinModalStyle.openForm)
      }
      closeForm={
        (category && categoryModalStyle.closeForm) ||
        (login && loginModalStyle.closeForm) ||
        (signin && signinModalStyle.closeForm)
      }
      className={
        (login && loginModalStyle.className) ||
        (signin && signinModalStyle.className) ||
        (category && categoryModalStyle.className)
      }
      toggleOpen={toggleOpen}
    >
      <div
        ref={ref}
        className={`${
          toggleOpen
            ? login &&
              (loginModalStyle.toggleOpen ||
                (signin && signinModalStyle.toggleOpen) ||
                (category && category && categoryModalStyle.toggleOpen))
            : (login && loginModalStyle.toggleClose) ||
              (signin && signinModalStyle.toggleClose) ||
              (category && categoryModalStyle.toggleClose)
        }
      
      ${
        (login && loginModalStyle.modalClassName) ||
        (signin && signinModalStyle.modalClassName) ||
        (category && categoryModalStyle.modalClassName)
      }`}
      >
        {children}
      </div>
    </Backdrop>
  );
}

export default Modal;

//  <Backdrop
//       openForm="bottom-0 animate__fadeIn"
//       closeForm="-top-[200vh] animate__fadeOut"
//       className="flex max-md:items-end right-0 left-0 md:items-center justify-center max-md:pb-6 mx-auto w-full bg-black/15 h-screen backdrop-blur-md overflow-hidden z-[60] animate__animated "
//       toggleOpen={toggleOpen}
//     >
//       <div
//         ref={ref}
//         className={`${
//           toggleOpen ? "animate__fadeInUpBig" : "animate__fadeOutDownBig"
//         }

//       flex items-center justify-center max-md:w-[23rem] md:w-[33.8rem] max-md:h-80 md:h-96 bg-white rounded-3xl shadow-md animate__animated`}
//       >
//         {children}
//       </div>
//     </Backdrop>

//  <Backdrop
//       openForm="right-0 left-0 animate__fadeIn"
//       closeForm="-right-[100vw] animate__fadeOut"
//       className="max-md:top-0 md:top-40 w-screen md:bg-black/15 h-svh max-md:bg-white md:backdrop-blur-md overflow-y-auto scrollbar-none animate__animated "
//       toggleOpen={toggleOpen}
//     >
//       <div
//         ref={ref}
//         className={`${
//           toggleOpen ? "animate__fadeInRightBig" : "animate__fadeOutRightBig"
//         }
//         md:bg-white md:max-w-xl md:mt-6 md:mr-6 md:rounded-3xl h-screen md:shadow-md md:flex md:items-center md:h-[30rem] md:justify-start animate__animated`}
//       >
//         {children}
//       </div>
//     </Backdrop>
