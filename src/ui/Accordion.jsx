"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

function Accordion({ label, children, className = "flex",titleStyle }) {
  const [ordersOpen, setOrdersOpen] = useState(false);
  const toggleOrders = () => {
    setOrdersOpen((prevState) => !prevState);
  };
  return (
    <div
      className={` flex-col border-[1.5px] border-stroke rounded-[20px] w-full px-6 ${className} ${
        ordersOpen ? "justify-between pb-6" : "items-center justify-center"
      } transition-all duration-200`}
    >
      <button
        onClick={toggleOrders}
        className="flex items-center justify-between gap-4 size-full max-md:py-6 md:py-4"
      >
        <p className={titleStyle}>{label}</p>
        <ChevronDownIcon
          className={`size-4 ${ordersOpen && "rotate-180"} duration-200`}
        />
      </button>
      {ordersOpen && children}
    </div>
  );
}

export default Accordion;
