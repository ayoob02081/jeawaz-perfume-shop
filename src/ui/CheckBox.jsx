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
    <label htmlFor={id} className={`flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        name={name}
        id={id}
        // checked={checked}
        value={value}
        // onChange={onChange}
        className="sr-only"
      />
      <p>{label}</p>
      {children}
    </label>
  );
}

export default CheckBox;
