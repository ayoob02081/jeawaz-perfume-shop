import RadioButton from "@/ui/RadioButton";
import ImageFrame from "./ImageFrame";

export default function CategoryRadioBtn({
  radioId,
  name,
  label,
  imageSrc,
  width,
}) {
  return (
    <RadioButton
      className="flex flex-col items-center justify-between h-full w-[6.75rem] text-xs rounded-b-lg px-2 py-3 text-text-primary
            has-checked:border has-checked:border-t-0 border-primary has-checked:px-3 has-checked:bg-white has-checked:*:bg-secondary2 duration-200"
      id={radioId}
      name={name}
      value={radioId}
      label={label}
      //   onChange=""
      //   checked=""
    >
      <ImageFrame
        src={imageSrc}
        alt="perfume image"
        className="felx items-center justify-center rounded-md bg-white size-10 duration-200"
        width={width}
      />
    </RadioButton>
  );
}
