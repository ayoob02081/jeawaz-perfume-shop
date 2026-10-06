function CheckBox({
  name,
  id,
  checked,
  value,
  onChange,
  label,
  className,
  children,
  textClassName = "text-xs",
}) {
  return (
    <label
      htmlFor={id}
      className={`relative flex flex-col items-center gap-2 ${className}`}
    >
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        value={value}
        onChange={onChange}
        className="sr-only"
      />
      {children}
      {label && <p className={`text-stroke-800 ${textClassName}`}>{label}</p>}
    </label>
  );
}

export default CheckBox;
