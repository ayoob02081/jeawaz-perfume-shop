import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function RadioButton({
  name,
  id,
  checked,
  value,
  onChange,
  label,
  className,
  chevron = "hidden",
  children,
  disabled,
}) {
  return (
    <label htmlFor={id} className={`cursor-pointer ${className}`}>
      <input
        type="radio"
        name={name}
        id={id}
        checked={checked}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      {children}
      {label && <p>{label}</p>}
      {chevron && (
        <span className={`max-md:!hidden ${chevron}`}>
          <ChevronLeftIcon className="size-full" />
        </span>
      )}
    </label>
  );
}

export default RadioButton;
