function CheckBox({
  name,
  id,
  checked,
  value,
  onChange,
  label,
  className,
  children,
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
        onChange={onChange}
        className="sr-only size-0"
      />
      {children}
      {label && <p className="text-xs">{label}</p>}
    </label>
  );
}

export default CheckBox;
