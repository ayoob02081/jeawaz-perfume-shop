import useOutsideClick from "@/hooks/useOutsideClick";
import Backdrop from "@/ui/Backdrop";

function Modal({ children, isOpen, onClose, category, className }) {
  const ref = useOutsideClick(onClose);

  return (
    <Backdrop
      openForm={
        category ? "animate__fadeIn" : "transform bottom-0 animate__fadeIn"
      }
      closeForm={`transform ${
        category ? "translate-x-[100vw]" : "translate-y-[100vh]"
      } animate__fadeOut`}
      className={`${
        category ? "secondary--backdrop" : "primary--backdrop"
      } animate__animated`}
      isOpen={isOpen}
      category={category ? true : false}
    >
      <div
        ref={ref}
        className={`flex justify-center z-[90] ${category ? "secondary--modal" : "primary--modal"} ${
          isOpen &&
          (category ? "animate__fadeInRightBig" : "animate__fadeInUpBig")
        } ${
          !isOpen &&
          (category ? "animate__fadeOutRightBig" : "animate__fadeOutDownBig")
        } animate__animated overflow-hidden ${className}`}
      >
        {children}
      </div>
    </Backdrop>
  );
}

export default Modal;
