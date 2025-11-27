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
  validationSchema = {},
  ...rest
}) {
  const errorMessages = errors?.[name];
  const hasError = !!(errors && errorMessages);
  return (
    <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
      <label htmlFor={name} className="text-text mb-4">
        {label}
        {isRequired && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        dir={dir}
        placeholder={placeholder}
        className={` ${className} ${
          dir === "ltr" ? "text-left" : "text-right"
        }`}
        {...register(name, validationSchema)}
        {...rest}
      />
      {errors && errors[name] && (
        <span className="text-error block text-xs mt-2">
          {errors[name]?.message}
        </span>
      )}
    </div>
  );
}
