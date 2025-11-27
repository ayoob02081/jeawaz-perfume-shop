"use client";

import Signin from "@/app/(user)/auth/_components/Signin";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();
  return (
    <Modal
      toggleOpen={() => router.back()}
      onClose={() => router.back()}
      signin
    >
      <Signin />
    </Modal>
  );
}

export default page;
