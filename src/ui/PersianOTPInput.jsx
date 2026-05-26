import React, { useRef } from "react";
import { cleanNumericValue, toPersianNumbers } from "@/utils/toPersianNumbers";

export default function PersianOTPInput({ value, onChange, numInputs = 5 }) {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    const cleaned = cleanNumericValue(val);

    const newValue = value.split("");
    newValue[index] = cleaned ? cleaned.slice(-1) : "";
    const finalValue = newValue.join("").slice(0, numInputs);
    onChange(finalValue);

    if (cleaned && index < numInputs - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1].focus();
      }
      const newValue = value.split("");
      newValue[index] = "";
      onChange(newValue.join(""));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const cleaned = cleanNumericValue(pastedData).slice(0, numInputs);
    onChange(cleaned);
  };

  return (
    <div
      className="flex flex-row gap-2 sm:gap-3 items-center justify-center w-full"
      dir="ltr"
    >
      {Array.from({ length: numInputs }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={toPersianNumbers(value[index] || "")}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          autoComplete="one-time-code"
          className="flex items-center justify-center text-center max-sm:size-11 sm:size-14 bg-stroke-50 border border-stroke-50 rounded-full outline-0 text-stroke-800 max-sm:text-lg sm:text-xl duration-200 focus:bg-stroke-0 focus:border-primary"
        />
      ))}
    </div>
  );
}
