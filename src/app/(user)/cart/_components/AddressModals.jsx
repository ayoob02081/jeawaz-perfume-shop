"use client";

import Modal from "@/components/Modal";

export function AllAddresses({ isListOpen, setIsListOpen }) {
  return (
    <Modal
      className="h-1/2"
      isOpen={isListOpen}
      onClose={() => setIsListOpen(false)}
    >
      <div className="flex items-center justify-center gap-2  bg-white h-full">
        <p>هنوز آدرسی ثبت نشده است</p>
      </div>
    </Modal>
  );
}
