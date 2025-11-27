"use client";

import Login from "@/app/(user)/auth/_components/Login";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import React from "react";

function page() {
  const router = useRouter();

  return (
    <Modal toggleOpen={() => router.back()} onClose={() => router.back()} login>
      <Login toggleLoginOpen={() => router.back()} />
    </Modal>
  );
}

export default page;
