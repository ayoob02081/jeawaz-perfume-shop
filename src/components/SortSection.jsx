"use client";

import SelectOption from "@/ui/SelectOption";
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
