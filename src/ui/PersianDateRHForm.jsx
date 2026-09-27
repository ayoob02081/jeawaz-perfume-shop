"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Controller } from "react-hook-form";
import { parseDateOnly, toDateOnlyString } from "@/utils/dateOnly.mjs";

function getNestedError(errors, path) {
  if (!errors || !path) return null;
  return path.split(".").reduce((acc, part) => acc?.[part], errors);
}

export default function PersianDateRHForm({
  control,
  name,
  label,
  placeholder,
  className,
  textClassName,
  isRequired,
  isPrimary,
  errors,
  validationSchema = {},
  // "iso": an instant (ISO timestamp); "date": a calendar day as YYYY-MM-DD
  // for DATE columns, taken from the picked local day with no UTC shift.
  valueFormat = "iso",
}) {
  const hasError = getNestedError(errors, name);
  const isDateOnly = valueFormat === "date";

  return (
    <div className="flex flex-col space-y-2 w-full">
      {label && (
        <label
          className={`text-stroke-800 max-md:text-base text-lg mr-2 ${textClassName}`}
        >
          {label}
          {isRequired && <span className="text-error mr-1">*</span>}
        </label>
      )}

      <Controller
        control={control}
        name={name}
        rules={validationSchema}
        render={({ field }) => (
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={
              isDateOnly
                ? (parseDateOnly(field.value) ?? "")
                : field.value
                  ? new Date(field.value)
                  : ""
            }
            placeholder={placeholder}
            onChange={(date) => {
              if (!date) return field.onChange(null);
              const jsDate = date.toDate();
              field.onChange(
                isDateOnly ? toDateOnlyString(jsDate) : jsDate.toISOString(),
              );
            }}
            inputClass={`textField__input py-3.5 ${hasError && "border-error bg-red-50 dark:bg-stroke-900"}
               ${className}`}
            calendarPosition="bottom-right"
          />
        )}
      />

      {hasError && (
        <span className="text-error text-xs mr-2">{hasError.message}</span>
      )}
    </div>
  );
}
