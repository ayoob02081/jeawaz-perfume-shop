import RadioButton from "@/ui/RadioButton";

export default function FilterRadioBtn({ radioId, name, label }) {
  return (
    <RadioButton
      className="flex flex-col items-start justify-start h-full text-xs text-text-secondary has-checked:text-primary duration-200 border-r-[2.5px] border-primary-10 has-checked:border-primary px-1 has-checked:font-bold leading-1.5"
      id={radioId}
      name={name}
      value={radioId}
      label={label}
      //   onChange=""
      //   checked=""
    />
  );
}
