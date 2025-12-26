import ImageFrame from "@/components/ImageFrame";
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
          <ImageFrame
            src={imageSrc}
            alt={`${checkId} icon`}
            className="size-full mix-blend-multiply"
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
                  : "bg-white border-text-secondary "
              } duration-200 `}
            >
              {checked && (
                <CheckIcon className="size-3.5 stroke-4 text-white duration-200" />
              )}
            </div>
            <p className={textClassName}>{label}</p>
          </span>
        ) : (
          <span className="flex items-center justify-start gap-1">
            <p className={textClassName}>{label}</p>
            <div
              className={`h-2 w-0.5 rounded-full ${
                checked ? "bg-primary" : "bg-secondary-2"
              } duration-200`}
            ></div>
          </span>
        ))}
    </CheckBox>
  );
}

export default FilterCheckBox;
