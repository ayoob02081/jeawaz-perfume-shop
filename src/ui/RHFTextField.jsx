export default function RHFTextField({
  type = "text",
  label,
  name,
  dir = "rtl",
  register,
  errors,
  isRequired,
  placeholder,
  className,
  textClassName,
  validationSchema = {},
  ...rest
}) {
  const hasError = errors?.[name];
  const onlyNumbers = (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  };

  return (
    <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
      {label && (
        <label
          htmlFor={name}
          className={`text-stroke-800 mb-4 max-md:text-base text-lg ${textClassName}`}
        >
          {label}
          {isRequired && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        id={name}
        dir={dir}
        placeholder={placeholder}
        inputMode={type === "tel" ? "numeric" : undefined}
        onInput={type === "tel" ? onlyNumbers : undefined}
        className={` ${className} ${
          dir === "ltr" ? "text-left" : "text-right"
        }`}
        {...rest}
        {...register(name, validationSchema)}
      />
      {hasError && (
        <span className="text-error block text-xs mt-2">
          {hasError?.message}
        </span>
      )}
    </div>
  );
}
