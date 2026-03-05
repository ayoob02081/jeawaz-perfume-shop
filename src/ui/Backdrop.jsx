"use client";

import { useEffect } from "react";

function Backdrop({
  children,
  isOpen,
  className,
  openForm,
  closeForm,
  category,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <article
      className={`${isOpen ? `${openForm}` : `${closeForm} `} 
    ${category === true ? "fixed" : "fixed"} max-md:duration-200 ${className}`}
    >
      {children}
    </article>
  );
}

export default Backdrop;
