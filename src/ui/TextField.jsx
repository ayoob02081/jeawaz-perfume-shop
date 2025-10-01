function TextField({
  name,
  value,
  type = "text",
  label,
  onChange,
  dir = "rtl",
  isRequired,
  className = "",
  placeholder,
}) {
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
        // value={value}
        // onChange={onChange}
        className={`textField__input ${
          dir === "ltr" ? "text-left" : "text-right"
        } ${className}`}
      />
    </div>
  );
}

export default TextField;
