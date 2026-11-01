import Modal from "@/components/Modal";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

function ConfirmModal({ cancellBtn, confirmBtn, isOpen, onClose, children, accessibleLabel, isPending = false }) {
  return (
    <Modal
      className="flex flex-col items-center justify-center gap-8 h-fit md:w-fit max-sm:p-4 p-6"
      isOpen={isOpen}
      onClose={onClose}
      accessibleLabel={accessibleLabel}
    >
      {children}

      <div className="flex items-center justify-center gap-4 w-full">
        <button
          type="button"
          className="btn btn--primary gap-1 px-3 py-2 w-full"
          onClick={cancellBtn}
        >
          <XMarkIcon className="stroke-3 size-4" />
          <p className="flex items-center justify-center translate-y-px">لغو</p>
        </button>
        <button
          type="submit"
          className="btn btn--success gap-1 px-3 py-2 w-full"
          onClick={confirmBtn}
          disabled={isPending}
          aria-busy={isPending || undefined}
        >
          <CheckIcon className="stroke-3 size-4" />
          <p className="flex items-center justify-center translate-y-px">{isPending ? "در حال ثبت…" : "تایید"}</p>
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
