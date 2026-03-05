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
      className={`backdrop ${
        category ? "backdrop--secondary" : "backdrop--primary"
      } animate__animated`}
      isOpen={isOpen}
      category={category ? true : false}
    >
      <div
        className={`flex ${category ? "justify-start md:container md:mx-auto" : "justify-center max-md:items-end md:items-center size-full container mx-auto"} xl:max-w-7xl`}
      >
        <section
          ref={ref}
          className={`modal ${category ? "modal--secondary md:w-fit" : "modal--primary"} ${
            isOpen &&
            (category ? "animate__fadeInRightBig" : "animate__fadeInUpBig")
          } ${
            !isOpen &&
            (category ? "animate__fadeOutRightBig" : "animate__fadeOutDownBig")
          } animate__animated overflow-hidden ${className}`}
        >
          {children}
        </section>
      </div>
    </Backdrop>
  );
}

export default Modal;
