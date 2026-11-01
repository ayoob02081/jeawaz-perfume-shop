"use client";

import {
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useId, useState } from "react";

// `keepMounted`: the closed panel stays in the server-rendered DOM, hidden,
// instead of mounting only on open (page content such as a product description).
function Accordion({ label, children, className = "flex", titleStyle, plus, keepMounted = false }) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const panelId = useId();
  const toggleAccordion = () => {
    setAccordionOpen((prevState) => !prevState);
  };
  return (
    <div
      className={`flex-col border-[1.5px] border-stroke-200 rounded-2.5xl w-full max-sm:px-4 px-6 ${className} ${
        accordionOpen ? "justify-between pb-4 sm:pb-6" : "items-center justify-center"
      } transition-all duration-200`}
    >
      <button
        type="button"
        onClick={toggleAccordion}
        aria-expanded={accordionOpen}
        aria-controls={keepMounted ? panelId : undefined}
        className="flex items-center justify-between gap-4 size-full max-sm:py-4 sm:py-6 md:py-4"
      >
        <h4 className={`text-start ${titleStyle}`}>{label}</h4>
        {plus ? (
          accordionOpen ? (
            <MinusIcon className="size-6 text-primary" />
          ) : (
            <PlusIcon className="size-6 text-stroke-600" />
          )
        ) : (
          <ChevronDownIcon
            className={`size-4 ${accordionOpen && "rotate-180"} text-stroke-800 duration-200`}
          />
        )}
      </button>
      {keepMounted ? (
        <div id={panelId} hidden={!accordionOpen}>
          {children}
        </div>
      ) : (
        accordionOpen && children
      )}
    </div>
  );
}

export default Accordion;
