import { useDragToClose } from "@/hooks/useDragToClose";
import useOutsideClick from "@/hooks/useOutsideClick";
import Backdrop from "@/ui/Backdrop";
import { useEffect, useRef } from "react";

function Modal({ children, isOpen, onClose, category, className="h-full" }) {
  const outsideRef = useOutsideClick(onClose);
  const modalRef = useRef(null);

  const dragHandlers = !category
    ? useDragToClose({ onClose, threshold: 120 })
    : {};

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.style.transform = "translate(0,0)";
      modalRef.current.style.transition = "";
    }
  }, [isOpen]);

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
          ref={(el) => {
            outsideRef.current = el;
            modalRef.current = el;
          }}
          {...dragHandlers}
          className={`modal ${category ? "modal--secondary md:w-fit" : "modal--primary"} ${
            isOpen &&
            (category ? "animate__fadeInRightBig" : "animate__fadeInUpBig")
          }} animate__animated overflow-hidden ${className}`}
          style={!category ? { touchAction: "pan-x" } : undefined}
        >
          {children}
        </section>
      </div>
    </Backdrop>
  );
}

export default Modal;
