
function RadioButton({ name, id, checked, value, onChange, label }) {
  return  (
    <div className="flex items-center gap-1">
      <input
        type="radio"
        name={name}
        id={id}
        checked={checked}
        value={value}
        onChange={onChange}
        className="cursor-pointer rounded-[5px] border-none size-4 checked:text-primary-900"
      />
      <label
        htmlFor={id}
        className="cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
}

export default RadioButton