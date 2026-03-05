"use client";

import SelectOptionGroup from "@/ui/SelectOptionGroup";
import { useState } from "react";

function SortSection() {
  const [dropOpen, setDropOpen] = useState(false);
  const openDrop = () => {
    setDropOpen((prevState) => !prevState);
  };
  return (
    <SelectOptionGroup dropOpen={dropOpen} onClick={openDrop}>
      <SelectOption label={"قدیمی ترین"} onClick={openDrop} value="oldest" />
      <SelectOption label={"جدید ترین"} onClick={openDrop} value="newest" />
      <SelectOption label={"پرفروش ترین"} onClick={openDrop} value="popular" />
    </SelectOptionGroup>
  );
}

export default SortSection;

function SelectOption({ label, value, onClick }) {
  return (
    <li
      value={value}
      onClick={onClick}
      className="flex items-center justify-start hover:bg-grey size-full px-1 md:py-2 rounded-md"
    >
      {label}
    </li>
  );
}
