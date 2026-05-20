"use client";

import Login from "@/app/(user)/auth/_components/Login";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();

  return (
    <Modal
      isOpen={true}
      onClose={() => router.back()}
      className="h-fit justify-end"
    >
      <Login closeBtn={true} />
    </Modal>
  );
}

export default page;
