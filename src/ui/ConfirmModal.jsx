import Modal from "@/components/Modal";

function ConfirmModal({ cancellBtn, confirmBtn, isOpen, onClose, children }) {
  return (
    <Modal
      className="flex flex-col items-center justify-center gap-8 h-fit md:w-fit p-6"
      isOpen={isOpen}
      onClose={onClose}
    >
      {children}

      <div className="flex items-center justify-center gap-4 w-full">
        <button
          type="button"
          className="btn btn--primary px-3 py-2 w-full"
          onClick={cancellBtn}
        >
          لغو
        </button>
        <button
          type="submit"
          className="btn btn--success px-3 py-2 w-full"
          onClick={confirmBtn}
        >
          تایید
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
