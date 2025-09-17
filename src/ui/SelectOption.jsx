import React from "react";

function SelectOption({ label, value, onClick }) {
  return (
    <li
      value={value}
      onClick={onClick}
      className="flex items-center justify-start hover:bg-secondary-2 size-full px-1 md:py-2 rounded-md"
    >
      {label}
    </li>
  );
}

export default SelectOption;
