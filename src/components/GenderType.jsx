import RadioButton from "@/ui/RadioButton";

function GenderType() {
  return (
    <div className="flex items-center justify-between gap-1">
      {/* <RadioButton checked="" id="man" label="مردانه" name="gender" onChange="" value="man" />
      <RadioButton checked="" id="woman" label="زنانه" name="gender" onChange="" value="woman" /> */}
      <button className="border-[1.5px] w-20 text-sm border-secondary2 py-1 px-3 rounded-4xl text-black focus:text-primary focus:border-primary">
        <p className="">مردانه</p>
      </button>
      <button className="border-[1.5px] w-20 text-sm border-secondary2 py-1 px-3 rounded-4xl text-black focus:text-primary focus:border-primary">
        <p className="">زنانه</p>
      </button>
    </div>
  );
}

export default GenderType;
