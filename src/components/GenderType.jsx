import RadioButton from "@/ui/RadioButton";

function GenderType({ section }) {
  return (
    <div className="flex items-center justify-between gap-1">
      <RadioButton
        className="btn border-[1.5px] w-20 text-sm border-secondary-2 py-1 px-3 rounded-4xl text-black has-checked:text-primary has-checked:border-primary duration-200"
        id={`man${section}`}
        name={`gender${section}`}
        value="man"
        label="مردانه"
        //   onChange=""
        //   checked=""
      />
      <RadioButton
        className="btn border-[1.5px] w-20 text-sm border-secondary-2 py-1 px-3 rounded-4xl text-black has-checked:text-primary has-checked:border-primary duration-200"
        id={`woman${section}`}
        name={`gender${section}`}
        value="woman"
        label="زنانه"
        //   onChange=""
        //   checked=""
      />
    </div>
  );
}

export default GenderType;
