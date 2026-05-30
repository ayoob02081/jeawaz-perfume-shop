function RHFTextAreaField({
  name,
  label,
  register,
  errors,
  textClassName,
  dir = "rtl",
  isRequired,
  className = "",
  placeholder,
  validationSchema = {},
  ...rest
}) {
  const hasError = errors?.[name];
  return (
    <div className="flex flex-col items-start justify-start text-sm size-full">
      <label
        htmlFor={name}
        className={`text-stroke-800 mb-4 max-md:text-base text-lg mr-2 ${textClassName}`}
      >
        {label}
        {isRequired && <span className="text-error">*</span>}
      </label>
      <textarea
        name={name}
        id={name}
        dir={dir}
        placeholder={placeholder}
        className={`textField__input ${
          hasError ? "border-error bg-red-50 dark:bg-stroke-900" : ""
        } ${dir === "ltr" ? "text-left" : "text-right"} ${className}`}
        {...register(name, validationSchema)}
        {...rest}
      />
      {hasError && (
        <span className="text-error block text-xs mt-2">
          {hasError?.message}
        </span>
      )}
    </div>
  );
}

export default RHFTextAreaField;
