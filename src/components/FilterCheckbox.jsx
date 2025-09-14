import CheckBox from "@/ui/CheckBox";
import ImageFrame from "./ImageFrame";

function FilterCheckbox({ checkId, name, label, className, imageSrc }) {
  return (
    <CheckBox
      className={`${className} justify-center text-nowrap max-md:px-2 text-text-primary h-12 px-2 rounded-[40px] has-checked:border border-primary has-checked:text-primary duration-200`}
      id={checkId}
      name={name}
      value={checkId}
      label={label}
      //   onChange=""
      //   checked=""
    >
      <div className="flex items-center justify-center px-2 py-1 bg-white rounded-full size-9">
        <ImageFrame
          src={imageSrc}
          alt={`${checkId} icon`}
          className="size-6 "
          objectFit="cover"
        />
      </div>
    </CheckBox>
  );
}

export default FilterCheckbox;
