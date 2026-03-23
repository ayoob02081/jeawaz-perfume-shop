import AppImage from "@/components/AppImage";
import CheckBox from "./CheckBox";
import { CheckIcon } from "@heroicons/react/24/outline";

function FilterCheckBox({
  checkId,
  name,
  label,
  className,
  imageSrc,
  checked,
  onChange,
  checkbox,
  imageClassName,
  textClassName,
  children,
}) {
  return (
    <CheckBox
      className={`${className} cursor-pointer scroll-smooth duration-200`}
      id={checkId}
      name={name}
      value={checkId}
      onChange={onChange}
      checked={checked}
      checkbox={checkbox}
      textClassName={textClassName}
    >
      {children}
      {imageSrc && (
        <div className={imageClassName}>
          <AppImage
            src={imageSrc}
            alt={checkId + "-icon"}
            width="size-full"
            sizes="20vw"
          />
        </div>
      )}
      {label &&
        (checkbox ? (
          <span className="flex items-center justify-start gap-3 w-full">
            <div
              className={`flex items-center justify-center size-5 rounded-md border-[1.5px] ${
                checked
                  ? "bg-primary border-primary"
                  : "bg-stroke-0 border-stroke-600 "
              } duration-200 `}
            >
              {checked && (
                <CheckIcon className="size-3.5 stroke-4 text-stroke-0 duration-200" />
              )}
            </div>
            <p
              className={`${textClassName} ${checked ? "text-primary" : "text-stroke-800 dark:text-stroke-500"} duration-200`}
            >
              {label}
            </p>
          </span>
        ) : (
          <span className="flex items-center justify-start gap-1">
            <p
              className={`${textClassName} ${checked ? "text-primary" : "text-stroke-800 dark:text-stroke-500"} duration-200`}
            >
              {label}
            </p>
            <div
              className={`h-2 w-0.5 rounded-full ${
                checked ? "bg-primary" : "bg-stroke-50 dark:bg-stroke-150"
              } duration-200`}
            ></div>
          </span>
        ))}
    </CheckBox>
  );
}

export default FilterCheckBox;
