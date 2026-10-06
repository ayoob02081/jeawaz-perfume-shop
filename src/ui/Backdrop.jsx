"use client";

import useBodyScrollLock from "@/hooks/useBodyScrollLock";

function Backdrop({ children, isOpen, className, category }) {
  useBodyScrollLock(isOpen);

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
