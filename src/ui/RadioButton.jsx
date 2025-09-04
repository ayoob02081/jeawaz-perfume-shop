function RadioButton({
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
      <label htmlFor={id} className={`cursor-pointer ${className}`}>
        <input
          type="radio"
          name={name}
          id={id}
          // checked={checked}
          value={value}
          // onChange={onChange}
          className="sr-only"
        />
        {children}
        {label}
      </label>
  );
}

export default RadioButton;
