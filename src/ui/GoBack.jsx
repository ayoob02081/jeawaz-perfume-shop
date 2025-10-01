"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function GoBack({ className, onClick, side = "right", label }) {
  const router = useRouter();

  const GoBackHandle = () => {
    {
      onClick && onClick();
    }
    router.back();
  };

  return (
    <button
      onClick={GoBackHandle}
      className="flex items-center justify-center size-full gap-2"
    >
      {label && side === "left" && <p className="">{label}</p>}
      {side === "right" ? (
        <ArrowRightIcon className={` ${className}`} />
      ) : (
        <ArrowLeftIcon className={` ${className}`} />
      )}
      {label && side === "right" && (
        <p className="text-xl text-text-primary font-bold">{label}</p>
      )}
    </button>
  );
}

export default GoBack;
