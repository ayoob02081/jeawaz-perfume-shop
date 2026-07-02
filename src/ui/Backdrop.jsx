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
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  } else {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  return () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
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
