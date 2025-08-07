function CheckBox({ name, id, checked, value, onChange, label, className }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        value={value}
        onChange={onChange}
        className="cursor-pointer form-checkbox rounded-[5px] border-none size-4 checked:text-primary-900"
      />
      <label htmlFor={id} className="cursor-pointer">
        {label}
      </label>
    </div>
  );
}

export default CheckBox;
