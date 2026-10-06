import React, { useEffect, useRef } from "react";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  applyOtpBackspace,
  applyOtpInput,
  applyOtpPaste,
  firstEmptyOtpIndex,
  getOtpSlots,
} from "@/utils/otpInputContract.mjs";

// `readOnly` keeps focus and the entered digits but ignores edits (e.g. while
// the code is being verified). The defaults are the login OTP's: browser SMS
// code suggestions and focus on mount. A screen with two codes turns both off
// (`autoComplete="off"`, `autoFocus={false}` on the second) so a suggestion
// can never land in the wrong code. `label` names each slot for screen
// readers.
export default function PersianOTPInput({
  value,
  onChange,
  numInputs = 5,
  readOnly = false,
  autoComplete = "one-time-code",
  autoFocus = true,
  label,
}) {
  const inputsRef = useRef([]);
  const slots = getOtpSlots(value, numInputs);

  // Focus the first empty slot when the OTP step appears.
  useEffect(() => {
    if (!autoFocus) return;
    inputsRef.current[firstEmptyOtpIndex(value, numInputs)]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e, index) => {
    if (readOnly) return;
    const next = applyOtpInput(value, index, e.target.value, {
      caret: e.target.selectionEnd,
      length: numInputs,
    });
    onChange(next.value);

    if (next.focusIndex !== index) {
      inputsRef.current[next.focusIndex].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !readOnly) {
      const next = applyOtpBackspace(value, index, numInputs);
      if (next.focusIndex !== index) {
        inputsRef.current[next.focusIndex].focus();
      }
      onChange(next.value);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (readOnly) return;
    const pastedData = e.clipboardData.getData("text");
    onChange(applyOtpPaste(pastedData, numInputs));
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
          // Room for a full autofilled code next to an existing digit; the
          // controlled value always renders one digit per slot.
          maxLength={numInputs + 1}
          value={toPersianNumbers(slots[index])}
          readOnly={readOnly}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          autoComplete={autoComplete}
          aria-label={
            label ? `${label}، رقم ${toPersianNumbers(index + 1)}` : undefined
          }
          className="flex items-center justify-center text-center max-sm:size-11 sm:size-14 bg-stroke-50 border border-stroke-50 rounded-full outline-0 text-stroke-800 max-sm:text-lg sm:text-xl duration-200 focus:bg-stroke-0 focus:border-primary"
        />
      ))}
    </div>
  );
}
