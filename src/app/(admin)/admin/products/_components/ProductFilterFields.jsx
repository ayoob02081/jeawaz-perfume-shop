"use client";

import CheckBox from "@/ui/CheckBox";
import { CheckIcon } from "@heroicons/react/24/outline";
import { toPersianNumbersWithComma } from "@/utils/toPersianNumbers";
import { PRODUCT_GRADES, gradeLabel } from "@/utils/productGrade.mjs";

// The admin Product list filter controls, shared by the desktop inline form
// and the mobile filter sheet. `draft` holds unapplied form values.
function ProductFilterFields({
  draft,
  setDraft,
  brands = [],
  genders = [],
  families = [],
  variant = "inline",
}) {
  const update = (key) => (event) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  const toggleFamily = (slug) =>
    setDraft((current) => ({
      ...current,
      fragranceFamilies: current.fragranceFamilies.includes(slug)
        ? current.fragranceFamilies.filter((value) => value !== slug)
        : [...current.fragranceFamilies, slug],
    }));

  const familyOptions = families.map((category) => (
    <CheckBox
      key={category.id}
      checked={draft.fragranceFamilies.includes(category.slug)}
      className=" flex-row whitespace-nowrap"
      label={category.title}
      onChange={() => toggleFamily(category.slug)}
      textClassName="text-base"
    >
      <div
        className={`flex items-center justify-center size-4 border rounded-sm  ${draft.fragranceFamilies.includes(category.slug) ? "border-primary bg-primary text-white" : "border-stroke-600 text-transparent "} transition-all duration-200`}
      >
        <CheckIcon className=" size-2.5 stroke-4 " />
      </div>
    </CheckBox>
  ));

  const familiesTitle = `خانواده‌های بویایی (${toPersianNumbersWithComma(draft.fragranceFamilies.length)})`;

  const fields = {
    search: (
      <label className="flex flex-col gap-1">
        <p className="pr-2 sm:text-lg font-bold">جستجو</p>
        <input
          name="search"
          className="textField__input rounded-xl p-2"
          value={draft.search}
          onChange={update("search")}
        />
      </label>
    ),
    brand: (
      <label className="flex flex-col gap-1">
        <p className="pr-2 sm:text-lg font-bold">برند</p>
        <select
          name="brandId"
          className="textField__input rounded-xl p-2"
          value={draft.brandId}
          onChange={update("brandId")}
        >
          <option value="">همه</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.title || brand.value}
            </option>
          ))}
        </select>
      </label>
    ),
    grade: (
      <label className="flex flex-col gap-1">
        <p className="pr-2 sm:text-lg font-bold">نوع کیفیت</p>
        <select
          name="grade"
          className="textField__input rounded-xl p-2"
          value={draft.grade}
          onChange={update("grade")}
        >
          <option value="">همه</option>
          {PRODUCT_GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {gradeLabel(grade)}
            </option>
          ))}
        </select>
      </label>
    ),
    gender: (
      <label className="flex flex-col gap-1">
        <p className="pr-2 sm:text-lg font-bold">جنسیت</p>
        <select
          name="gender"
          className="textField__input rounded-xl p-2"
          value={draft.gender}
          onChange={update("gender")}
        >
          <option value="">همه</option>
          {genders.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.title}
            </option>
          ))}
        </select>
      </label>
    ),
  };

  if (variant === "sheet") {
    // One scrolling column: every control and every family stays reachable.
    return (
      <div className="flex flex-col gap-3">
        {fields.search}
        {fields.brand}
        {fields.grade}
        {fields.gender}
        <fieldset className="flex flex-col gap-2 rounded-md border border-stroke-200 sm:p-2">
          <legend className="px-1 sm:text-lg font-bold">{familiesTitle}</legend>
          <div className="flex flex-wrap items-start justify-start gap-4 p-2">
            {familyOptions}
          </div>
        </fieldset>
      </div>
    );
  }

  return (
    <div className="flex max-md:flex-wrap gap-3 size-full">
      <div className="flex items-center gap-4 w-full">
        <div className="flex grow flex-col gap-2 sm:w-full">
          {fields.search}
          {fields.brand}
        </div>
        <div className="flex max-sm:flex-none sm:grow flex-col gap-2 sm:w-full">
          {fields.grade}
          {fields.gender}
        </div>
      </div>
      <details className="relative btn w-full flex-col items-start justify-start rounded-md border border-stroke-200 p-2 transition-all duration-200">
        <summary className="cursor-pointer sm:text-lg font-bold">
          {familiesTitle}
        </summary>
        <div className="flex grow items-start flex-wrap justify-center gap-4 max-h-44 overflow-auto p-2 max-w-full transition-all duration-200">
          {familyOptions}
        </div>
      </details>
    </div>
  );
}

export default ProductFilterFields;
