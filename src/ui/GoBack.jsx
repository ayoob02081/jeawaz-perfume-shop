"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function GoBack({
  className,
  onClick,
  side = "right",
  label,
  fontStyle = "text-xl font-bold truncate",
  justify = "center",
}) {
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
      className={`flex items-center justify-${justify} size-full gap-2`}
    >
      {justify === "between" && side === "left" && <div></div>}

      {label && side === "left" && <p className="truncate text-stroke-800">{label}</p>}
      {side === "right" ? (
        <ArrowRightIcon className={`text-stroke-800 ${className}`} />
      ) : (
        <ArrowLeftIcon className={`text-stroke-800 ${className}`} />
      )}
      {label && side === "right" && (
        <p className={`${fontStyle} text-stroke-800`}>{label}</p>
      )}
      {justify === "between" && side === "right" && <div></div>}
    </button>
  );
}

export default GoBack;
