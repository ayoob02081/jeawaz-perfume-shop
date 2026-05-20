"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Controller } from "react-hook-form";

export default function PersianDateRHForm({
  control,
  name,
  label,
  placeholder,
  className,
  textClassName,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          className={`text-stroke-800 mb-4 max-md:text-base text-lg ${textClassName}`}
        >
          {label}
        </label>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={field.value}
            placeholder={placeholder}
            onChange={(date) => {
              field.onChange(date?.format("YYYY-MM-DD"));
            }}
            inputClass={className}
            calendarPosition="bottom-right"
          />
        )}
      />
    </div>
  );
}
