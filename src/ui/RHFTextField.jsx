"use client";

import { Controller } from "react-hook-form";
import {
  cleanNumericValue,
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

function getNestedError(errors, path) {
  if (!errors || !path) return null;
  return path.split(".").reduce((acc, part) => acc?.[part], errors);
}

export default function RHFTextField({
  type = "text",
  label,
  name,
  dir = "rtl",
  register,
  control,
  errors,
  isRequired,
  placeholder,
  className = "",
  textClassName = "font-medium",
  containerClassName = "h-12 md:h-14",
  icon: Icon,
  validationSchema = {},
  isPrice = false,
  children,
  ...rest
}) {
  const hasError = getNestedError(errors, name);

  const inputBaseClass = `outline-0 size-full bg-transparent ${
    dir === "ltr" ? "text-left" : "text-right"
  } ${className}`;

  return (
    <div className="flex flex-col items-start justify-center w-full space-y-2">
      {label && (
        <label
          htmlFor={name}
          className={`text-stroke-800 text-sm md:text-base mr-2 ${textClassName}`}
        >
          {label}
          {isRequired && <span className="text-error mr-1">*</span>}
        </label>
      )}

      <div className={containerClassName + " w-full relative"}>
        <div
          className={`textField__input rounded-5xl ${
            hasError ? "border-error bg-red-50 dark:bg-stroke-900" : ""
          }`}
        >
          {Icon && <Icon className="size-5 shrink-0" />}
          {control && (isPrice || type === "tel") ? (
            <Controller
              name={name}
              control={control}
              rules={validationSchema}
              render={({ field }) => (
                <input
                  {...rest}
                  {...field}
                  id={name}
                  type="text"
                  dir={dir}
                  inputMode="numeric"
                  placeholder={placeholder}
                  value={
                    isPrice
                      ? toPersianNumbersWithComma(field.value)
                      : toPersianNumbers(field.value)
                  }
                  onChange={(e) => {
                    const rawValue = cleanNumericValue(e.target.value);
                    field.onChange(rawValue);
                  }}
                  className={inputBaseClass}
                />
              )}
            />
          ) : (
            <input
              {...rest}
              {...(register ? register(name, validationSchema) : {})}
              type={type}
              id={name}
              dir={dir}
              placeholder={placeholder}
              inputMode={
                type === "tel" || type === "number" ? "numeric" : undefined
              }
              className={inputBaseClass}
            />
          )}
        {children}
        </div>
        {hasError && (
          <span className="absolute -bottom-5 right-2 text-error block text-[10px] md:text-xs animate-fadeIn">
            {hasError.message}
          </span>
        )}
      </div>
    </div>
  );
}
