"use client";

import {
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

function Accordion({ label, children, className = "flex", titleStyle,plus }) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const toggleAccordion = () => {
    setAccordionOpen((prevState) => !prevState);
  };
  return (
    <div
      className={` flex-col border-[1.5px] border-stroke rounded-[20px] w-full px-6 ${className} ${
        accordionOpen ? "justify-between pb-6" : "items-center justify-center"
      } transition-all duration-200`}
    >
      <button
        onClick={toggleAccordion}
        className="flex items-center justify-between gap-4 size-full max-md:py-6 md:py-4"
      >
        <p className={titleStyle}>{label}</p>
        {plus ? (
          accordionOpen ? (
            <MinusIcon className="size-6 text-primary" />
          ) : (
            <PlusIcon className="size-6 text-text-secondary" />
          )
        ) : (
          <ChevronDownIcon
            className={`size-4 ${accordionOpen && "rotate-180"} duration-200`}
          />
        )}
      </button>
      {accordionOpen && children}
    </div>
  );
}

export default Accordion;
