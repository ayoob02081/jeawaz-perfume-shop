import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function RadioButton({
  name,
  id,
  checked,
  value,
  onChange,
  label,
  className,
  childrenClassName,
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
        className="sr-only size-0"
      />
      <div className={`flex ${childrenClassName} gap-2`}>
        {children}
        {label && <p>{label}</p>}
      </div>
      {chevron && (
        <span className={`max-md:hidden! ${chevron}`}>
          <ChevronLeftIcon className="size-full" />
        </span>
      )}
    </label>
  );
}

export default RadioButton;
