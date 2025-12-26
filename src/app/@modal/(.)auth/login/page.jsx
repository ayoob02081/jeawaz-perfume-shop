"use client";

import Login from "@/app/(user)/auth/_components/Login";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();

  return (
    <Modal
      isOpen={() => router.back()}
      onClose={() => {router.back()}}
      className="max-md:h-80 md:h-[30rem]"
    >
      <Login toggleModalOpen={() => router.back()} />
    </Modal>
  );
}

export default page;
