function RHFRadioButton({
  name,
  id,
  checked,
  value,

  // label,
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
      />
      {children}
    </label>
  );
}

export default RHFRadioButton;
