import React from "react";

const RHFSelect = ({
  label,
  name,
  register,
  errors,
  options = [],
  isRequired = false,
  validationSchema = {},
  placeholder = "انتخاب کنید",
  className = "",
  disabled = false,
  ...rest
}) => {
  const hasError = errors?.[name];

  return (
    <div className={`flex flex-col gap-2 w-full `}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm md:text-base text-stroke-800 mr-2"
        >
          {label} {isRequired && <span className="text-error">*</span>}
        </label>
      )}

      <select
        id={name}
        disabled={disabled}
        {...register(name, {
          ...(isRequired && { required: `${label || name} الزامی است` }),
          ...validationSchema,
        })}
        className={` ${className}
          w-full h-12.5 rounded-5xl border-[1.5px] outline-none appearance-none bg-no-repeat bg-position-[left_1rem_center] 
          ${disabled ? "opacity-75 text-stroke-400 cursor-not-allowed" : "text-stroke-800"}
          ${hasError ? "border-error focus:border-error bg-red-50 dark:bg-stroke-900" : " focus:border-primary"}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundSize: "1.25rem",
        }}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasError && (
        <span className="text-error text-xs mt-1">{hasError?.message}</span>
      )}
    </div>
  );
};

export default RHFSelect;
