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
      {label && <p>{label}</p>}
      {chevron === "block" && (
        <div className={`w-8 ${chevron}`}>
          <ChevronLeftIcon className="max-md:hidden size-3" />
        </div>
      )}
    </label>
  );
}

export default RadioButton;
