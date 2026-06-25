"use client";

import useOutsideClick from "@/hooks/useOutsideClick";
import SelectOptionGroup from "@/ui/SelectOptionGroup";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const sortData = [
  {
    id: 1,
    value: "newest",
    label: "جدید ترین",
  },
  {
    id: 2,
    value: "oldest",
    label: "قدیمی ترین",
  },
  {
    id: 3,
    value: "best_selling",
    label: "پرفروش ترین",
  },
  {
    id: 4,
    value: "most_discounted",
    label: "پرتخفیف ترین",
  },
];

function SortSection() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSortSearchParams = searchParams.get("sort");
  const currentSort = sortData.find((s) => s.value === currentSortSearchParams);
  const [dropOpen, setDropOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState();
  const ref = useOutsideClick(() => setDropOpen(false));

  const handleSort = (data) => {
    const { value, label } = data;
    if (currentSortSearchParams === value) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");

    setSortLabel(label);
    router.replace(`${pathname}?${params.toString()}`);
    setDropOpen(false);
  };

  useEffect(() => {
    if (currentSort) {
      setSortLabel(currentSort?.label);
    } else {
      setSortLabel("مرتب سازی");
    }
  }, [currentSortSearchParams]);

  return (
    <SelectOptionGroup
      ref={ref}
      dropOpen={dropOpen}
      onClick={() => setDropOpen((prevent) => !prevent)}
      label={sortLabel}
    >
      {sortData.map((item) => (
        <SelectOption
          key={item.id}
          label={item.label}
          value={item.value}
          onClick={() => handleSort({ value: item.value, label: item.label })}
        />
      ))}
    </SelectOptionGroup>
  );
}

export default SortSection;

function SelectOption({ label, value, onClick }) {
  return (
    <li
      value={value}
      onClick={onClick}
      className="flex items-center justify-start md:hover:bg-stroke-100 active:bg-stroke-100 size-full px-2 md:py-2 rounded-md text-stroke-800"
    >
      {label}
    </li>
  );
}
