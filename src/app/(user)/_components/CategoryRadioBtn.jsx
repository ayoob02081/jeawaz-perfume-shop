import ImageFrame from "@/components/ImageFrame";
import RadioButton from "@/ui/RadioButton";

export default function CategoryRadioBtn({
  radioId,
  name,
  label,
  imageSrc,
  size,
  chevron,
  className,
}) {
  return (
    <RadioButton
      className={`${className} flex max-md:flex-col md:flex-row items-center justify-between max-md:h-full w-[6.75rem] md:w-56 text-xs md:text-sm max-md:rounded-b-lg md:rounded-r-lg max-md:px-2 md:pr-2 py-3 text-text-primary
            has-checked:border max-md:has-checked:border-t-0 md:has-checked:border-l-0 border-primary max-md:has-checked:px-3 has-checked:font-bold has-checked:bg-white has-checked:**:[img]:bg-grey duration-200`}
      id={radioId}
      name={name}
      value={radioId}
      label={label}
      chevron={chevron}
      //   onChange=""
      //   checked=""
    >
      <ImageFrame
        src={imageSrc}
        alt="perfume image"
        className={`felx items-center justify-center rounded-md bg-white ${size} duration-200 overflow-hidden`}
      />
    </RadioButton>
  );
}
