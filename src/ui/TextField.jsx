function TextField({
  name,
  value,
  type = "text",
  label,
  onChange,
  dir = "rtl",
  isRequired,
  className ="",
}) {
  return (
    <div className="space-y-4">
      <label htmlFor={name} className="text-secondary-600 text-lg mb-4">
        {label}
        {isRequired && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        dir={dir}
        value={value}
        onChange={onChange}
        className={`textField__input ${
          dir === "ltr" ? "text-left" : "text-right"
        } ${className}`}
      />
    </div>
  );
}

export default TextField;
