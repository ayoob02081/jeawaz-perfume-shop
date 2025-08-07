"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

function GoBack() {
  const router = useRouter();

  const GoBackHandle = () => {
    router.back();
  };

  return (
    <button onClick={GoBackHandle}>
      <ArrowLeftIcon className="size-8 text-secondary-600 hover:text-secondary-800 transition-all duration-300" />
    </button>
  );
}

export default GoBack;
