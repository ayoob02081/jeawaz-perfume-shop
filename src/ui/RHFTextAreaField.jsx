function RHFTextAreaField({
  name,
  label,
  register,
  dir = "rtl",
  isRequired,
  className = "",
  placeholder,
  validationSchema = {},
  ...rest
}) {
  return (
    <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
      <label htmlFor={name} className="text-text mb-4">
        {label}
        {isRequired && <span className="text-error">*</span>}
      </label>
      <textarea
        name={name}
        id={name}
        dir={dir}
        placeholder={placeholder}
        className={`textField__input ${
          dir === "ltr" ? "text-left" : "text-right"
        } ${className}`}
        {...register(name, validationSchema)}
        {...rest}
      />
    </div>
  );
}

export default RHFTextAreaField;
