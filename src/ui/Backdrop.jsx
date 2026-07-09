"use client";

import { useEffect } from "react";

function Backdrop({ children, isOpen, className, category }) {
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
    <div
      className={`backdrop ${
        category ? "backdrop--secondary" : "backdrop--primary"
      } transform animate__fadeIn ${
        isOpen
          ? `${category ? "translate-x-0" : " bottom-0 translate-y-0"}`
          : `${`${
              category ? "translate-x-full" : "translate-y-full"
            } animate__fadeOut`} `
      } 
    fixed transition-all duration-200 animate__animated ${className}`}
    >
      {children}
    </div>
  );
}

export default Backdrop;
