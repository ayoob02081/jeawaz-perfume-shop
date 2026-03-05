function RHFRadioButton({
  name,
  id,
  checked,
  value,
  className,
  children,
  disabled,
  register,
  validationSchema = {},
  ...rest
}) {
  return (
    <label htmlFor={id} className={`cursor-pointer ${className}`}>
      <input
        type="radio"
        name={name}
        id={id}
        checked={checked}
        value={value}
        {...register(name, validationSchema)}
        {...rest}
        disabled={disabled}
        className="sr-only size-0"
      />
      {children}
    </label>
  );
}

export default RHFRadioButton;
