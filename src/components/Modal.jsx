import { Dialog } from "@base-ui/react/dialog";
import { useDragToClose } from "@/hooks/useDragToClose";
import useOutsideClick from "@/hooks/useOutsideClick";
import Backdrop from "@/ui/Backdrop";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

const ModalDismissalContext = createContext(null);

export function useModalDismissal() {
  return useContext(ModalDismissalContext);
}

function Modal({
  children,
  isOpen,
  onClose,
  category,
  className = "h-full",
  backdropClassName,
  scrollable = false,
  // Opt-in: existing consumers with their own dialog semantics are unchanged.
  accessibleLabel,
}) {
  // Closed modals stay mounted; only an open modal may react to outside clicks.
  const outsideRef = useOutsideClick(onClose, true, isOpen && !accessibleLabel);
  const modalRef = useRef(null);

  const lifecycle = useRef({ isOpen, dismissed: !isOpen, notified: !isOpen });
  const onCloseRef = useRef(onClose);
  const cancelDragRef = useRef(null);
  onCloseRef.current = onClose;
  if (lifecycle.current.isOpen !== isOpen) {
    lifecycle.current = { isOpen, dismissed: !isOpen, notified: !isOpen };
  }

  const beginDismiss = useCallback(() => {
    lifecycle.current.dismissed = true;
  }, []);
  const dismiss = useCallback(() => {
    const state = lifecycle.current;
    if (!state.isOpen || state.notified) return;
    // Invalidate descendants before calling navigation or an external close.
    state.dismissed = true;
    state.notified = true;
    cancelDragRef.current?.();
    onCloseRef.current();
  }, []);
  const dismissal = useMemo(() => ({
    dismiss,
    isDismissed: () => lifecycle.current.dismissed,
  }), [dismiss]);

  const { cancel: cancelDrag, ...dragHandlers } = useDragToClose({
    onClose: accessibleLabel ? dismiss : onClose,
    onDismissStart: accessibleLabel ? beginDismiss : undefined,
    enabled: isOpen,
    threshold: 120,
  });
  cancelDragRef.current = cancelDrag;

  useEffect(() => {
    if (!accessibleLabel) return undefined;
    const state = lifecycle.current;
    state.dismissed = !isOpen;
    state.notified = !isOpen;
    const deactivate = () => {
      state.dismissed = true;
      state.notified = true;
      cancelDragRef.current?.();
    };
    // Back/Forward already performed the history transition: invalidate only.
    if (isOpen) window.addEventListener("popstate", deactivate, true);
    return () => {
      deactivate();
      window.removeEventListener("popstate", deactivate, true);
    };
  }, [accessibleLabel, isOpen]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.style.transform = "translate(0,0)";
      modalRef.current.style.transition = "";
    }
  }, [isOpen]);

  const Surface = accessibleLabel ? Dialog.Popup : "section";
  const content = (
    <Backdrop isOpen={isOpen} category={category} className={backdropClassName}>
      <div
        className={`flex ${category ? "justify-start lg:container lg:mx-auto max-lg:h-full lg:p-2" : "bottom-2 max-h-[90dvh] justify-center max-md:items-end md:items-center size-full container mx-auto"} xl:max-w-7xl`}
      >
        <Surface
          {...(accessibleLabel ? {
            "aria-label": accessibleLabel,
            "aria-modal": true,
            dir: "rtl",
            initialFocus: () => modalRef.current?.querySelector("input:not([disabled])") ?? modalRef.current,
            finalFocus: true,
            // Step changes remove the focused phone/code field. Base UI restores
            // the popup; forward that fallback focus to the new input, synchronously.
            onFocus: (event) => {
              if (event.target === event.currentTarget) {
                event.currentTarget.querySelector("input:not([disabled])")?.focus();
              }
            },
          } : {})}
          ref={(el) => {
            outsideRef.current = el;
            modalRef.current = el;
          }}
          {...(!category && !scrollable ? dragHandlers : {})}
          className={`modal ${category ? "modal--secondary lg:w-fit" : "modal--primary"} ${
            isOpen &&
            (category ? "animate__fadeInRightBig" : "animate__fadeInUpBig")
          }} animate__animated overflow-hidden ${className}`}
          style={
            !category
              ? { touchAction: scrollable ? "pan-y" : "pan-x" }
              : undefined
          }
        >
          {children}
        </Surface>
      </div>
    </Backdrop>
  );

  if (!accessibleLabel) return content;
  return (
    <ModalDismissalContext.Provider value={dismissal}>
      <Dialog.Root open={isOpen} modal="trap-focus" onOpenChange={(open) => { if (!open) dismiss(); }}>
        <Dialog.Portal>{content}</Dialog.Portal>
      </Dialog.Root>
    </ModalDismissalContext.Provider>
  );
}

export default Modal;
