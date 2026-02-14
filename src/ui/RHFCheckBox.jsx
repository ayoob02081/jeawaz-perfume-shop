function RHFCheckBox({
  name,
  id,
  checked,
  value,
  label,
  className,
  children,
  register,
  validationSchema = {},
  ...rest
}) {
  return (
    <label
      htmlFor={id}
      className={`flex flex-col items-center gap-2 ${className}`}
    >
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        value={value}
        {...register(name, validationSchema)}
        {...rest}
        className="sr-only size-0"
      />
      {children}
      {label && <p className="text-xs">{label}</p>}
    </label>
  );
}

export default RHFCheckBox;
