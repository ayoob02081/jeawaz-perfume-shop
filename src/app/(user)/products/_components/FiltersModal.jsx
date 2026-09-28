"use client";

import { useGetProductVolumeOptions } from "@/hooks/useProducts";
import {
  CONCENTRATION_FILTER_LABEL,
  TAXONOMY_FILTER_GROUPS,
  activeFilterCount,
  mergeVolumeOptions,
  validatePriceRange,
} from "@/utils/productFilterContract.mjs";
import {
  PRODUCT_CONCENTRATIONS,
  concentrationLabel,
} from "@/utils/productConcentration.mjs";

const concentrationOptions = PRODUCT_CONCENTRATIONS.map((value) => ({
  id: value,
  slug: value,
  title: concentrationLabel(value),
}));
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  useGetAllBrandCategories,
  useGetStorefrontCategoriesByType,
} from "@/hooks/useCategories";
import { useFilters } from "@/hooks/useFilters";
import { Badge } from "@/ui/Badge";
import FilterCheckBox from "@/ui/FilterCheckBox";
import RHFTextField from "@/ui/RHFTextField";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

function FiltersModal({
  isOpen,
  mode,
  setMode,
  onClose,
  resetAllFilters,
  addFilter,
  resetFilter,
  filtersFromUrl,
  control,
  watch,
  errors,
}) {
  const { data: genderCategories } = useGetStorefrontCategoriesByType("gender");
  const { data: fragranceFamilyCategories } =
    useGetStorefrontCategoriesByType("fragrance_family");
  const { data: seasonCategories } = useGetStorefrontCategoriesByType("season");
  const { data: temperatureCategories } =
    useGetStorefrontCategoriesByType("temperature");
  const { data: characterCategories } =
    useGetStorefrontCategoriesByType("character");
  const { data: occasionCategories } =
    useGetStorefrontCategoriesByType("occasion");
  const taxonomyOptions = {
    seasons: seasonCategories,
    temperature: temperatureCategories,
    characters: characterCategories,
    occasions: occasionCategories,
    concentrations: concentrationOptions,
    gender: genderCategories,
  };
  const { data: brandCategories } = useGetAllBrandCategories();
  const {
    data: volumeResponse,
    isPending: volumesLoading,
    isError: volumesError,
  } = useGetProductVolumeOptions(isOpen);

  const { state } = useFilters();
  const volumes = mergeVolumeOptions(
    volumeResponse?.data,
    state.draft?.volumes,
  ).map((quantity) => ({
    id: quantity,
    quantity,
    value: String(quantity),
    title: `${toPersianNumbers(quantity)} میل`,
  }));

  const hasFilters =
    activeFilterCount(filtersFromUrl) > 0 || activeFilterCount(state.draft) > 0;

  const titles = {
    all: "فیلترها",
    brand: "برند",
    fragranceFamilies: "رایحه",
    ...Object.fromEntries(
      TAXONOMY_FILTER_GROUPS.map(({ key, label }) => [key, label]),
    ),
    concentrations: CONCENTRATION_FILTER_LABEL,
    volume: "حجم",
    type: "نوع محصول",
    gender: "جنسیت",
    price: "قیمت",
  };

  const renderTypes = () => {
    switch (mode) {
      case "all":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl md:pl-3">
            <div className="flex flex-col justify-between md:gap-4">
              <FilterOption
                button
                title="برند"
                description=" انتخاب برند عطر"
                openFilter={() => setMode("brand")}
                data={brandCategories}
                state={state.draft?.brandIds}
                addFilter={addFilter}
                resetFilter={resetFilter}
                type="brandIds"
              />
              <FilterOption
                button
                title="رایحه"
                description=" انتخاب رایحه عطر"
                openFilter={() => setMode("fragranceFamilies")}
                data={fragranceFamilyCategories}
                state={state.draft?.fragranceFamilies}
                addFilter={addFilter}
                resetFilter={resetFilter}
                type="fragranceFamilies"
              />
              {TAXONOMY_FILTER_GROUPS.map(({ key, label, multiple }) =>
                multiple ? (
                  <FilterOption
                    key={key}
                    button
                    title={label}
                    description={`انتخاب ${label}`}
                    openFilter={() => setMode(key)}
                    data={taxonomyOptions[key]}
                    state={state.draft?.[key]}
                    addFilter={addFilter}
                    resetFilter={resetFilter}
                    type={key}
                  />
                ) : (
                  <FilterOption key={key} title={label}>
                    <SingleCategoryFilter
                      field={key}
                      label={label}
                      options={taxonomyOptions[key]}
                      value={state.draft?.[key]}
                      addFilter={addFilter}
                      setMode={setMode}
                    />
                  </FilterOption>
                ),
              )}
              <FilterOption title="نوع محصول">
                <VariantTypeFilter
                  value={state.draft?.type}
                  addFilter={addFilter}
                  setMode={setMode}
                />
              </FilterOption>
              <FilterOption
                button
                title={CONCENTRATION_FILTER_LABEL}
                description={`انتخاب ${CONCENTRATION_FILTER_LABEL}`}
                openFilter={() => setMode("concentrations")}
                data={concentrationOptions}
                state={state.draft?.concentrations}
                addFilter={addFilter}
                resetFilter={resetFilter}
                type="concentrations"
              />
              <FilterOption
                title="حجم"
                button
                data={volumes}
                description="انتخاب حجم عطر"
                openFilter={() => setMode("volume")}
                type="volumes"
                state={state.draft?.volumes}
                setMode={setMode}
                addFilter={addFilter}
                resetFilter={resetFilter}
              />
              <FilterOption title="قیمت">
                <PriceFilter
                  addFilter={addFilter}
                  resetFilter={resetFilter}
                  state={state.draft}
                  setMode={setMode}
                  control={control}
                  watch={watch}
                  errors={errors}
                  hidde
                />
              </FilterOption>
              <FilterOption>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    addFilter("SET_ITEM", "original", !state?.draft?.original);
                  }}
                  className="flex items-center justify-between size-full gap-3"
                >
                  <div>
                    <p className="flex font-bold text-stroke-800">
                      فقط کالاهای اورجینال
                    </p>
                  </div>
                  <div
                    className={`relative flex items-center  gap-2  rounded-full p-0.5 w-11 h-6 
                    ${state?.draft?.original ? "bg-primary justify-start" : "justify-en bg-stroke-200 dark:bg-stroke-50 transition-all duration-200"}`}
                  >
                    <div
                      className={`absolute flex items-center justify-center h-5 aspect-square rounded-full  ${
                        state?.draft?.original
                          ? " bg-stroke-0 "
                          : "-translate-x-full bg-stroke-150 dark:bg-stroke-0"
                      } shadow transition-all duration-200`}
                    />
                  </div>
                </button>
              </FilterOption>
              <FilterOption>
                <button
                  type="button"
                  onClick={(e) => {
                    (e.preventDefault(),
                      addFilter("SET_ITEM", "inStock", !state?.draft?.inStock));
                  }}
                  className="flex items-center justify-between size-full gap-3"
                >
                  <div>
                    <p className="flex font-bold text-stroke-800">
                      فقط کالاهای موجود
                    </p>
                  </div>
                  <div
                    className={`relative flex items-center  gap-2  rounded-full p-0.5 w-11 h-6 
                    ${state?.draft?.inStock ? "bg-primary justify-start" : "justify-en bg-stroke-200 dark:bg-stroke-50 transition-all duration-200"}`}
                  >
                    <div
                      className={`absolute flex items-center justify-center h-5 aspect-square rounded-full  ${
                        state?.draft?.inStock
                          ? " bg-stroke-0 "
                          : "-translate-x-full bg-stroke-150 dark:bg-stroke-0"
                      } shadow transition-all duration-200`}
                    />
                  </div>
                </button>
              </FilterOption>
            </div>
          </div>
        );
      case "brand":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <BrandsFilter
              brands={brandCategories}
              state={state.draft?.brandIds}
              addFilter={addFilter}
              type="brandIds"
            />
          </div>
        );
      case "fragranceFamilies":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <FragranceFamiliesFilter
              fragranceFamilies={fragranceFamilyCategories}
              state={state.draft?.fragranceFamilies}
              addFilter={addFilter}
              type="fragranceFamilies"
            />
          </div>
        );
      case "seasons":
      case "characters":
      case "occasions":
      case "concentrations":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <FragranceFamiliesFilter
              fragranceFamilies={taxonomyOptions[mode]}
              state={state.draft?.[mode]}
              addFilter={addFilter}
              type={mode}
            />
          </div>
        );
      case "volume":
        return (
          <div className="flex flex-col items-start justify-start gap-3 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            {volumesLoading && (
              <p className="text-sm text-stroke-600">در حال دریافت حجم‌ها...</p>
            )}
            {volumesError && (
              <p className="text-sm text-stroke-600">
                دریافت حجم‌ها ناموفق بود؛ حجم‌های انتخاب‌شده حفظ شده‌اند.
              </p>
            )}
            {!volumesLoading && !volumesError && volumes.length === 0 && (
              <p className="text-sm text-stroke-600">
                حجمی برای انتخاب موجود نیست.
              </p>
            )}
            <VolumesFilter
              volumes={volumes}
              state={state.draft?.volumes}
              addFilter={addFilter}
              type="volumes"
            />
          </div>
        );
      case "temperature":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <SingleCategoryFilter
              mode={mode}
              addFilter={addFilter}
              setMode={setMode}
              field={"temperature"}
              label={"طبع عطر"}
              value={state.draft?.temperature}
              options={taxonomyOptions["temperature"]}
            />
          </div>
        );
      case "type":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <VariantTypeFilter
              value={state.draft?.type}
              addFilter={addFilter}
              setMode={setMode}
              mode={mode}
            />
          </div>
        );
      case "gender":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <SingleCategoryFilter
              mode={mode}
              addFilter={addFilter}
              setMode={setMode}
              field={"gender"}
              label={"جنسیت عطر"}
              value={state.draft?.gender}
              options={taxonomyOptions["gender"]}
            />
          </div>
        );
      case "price":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl max-md:px-4">
            <PriceFilter
              addFilter={addFilter}
              resetFilter={resetFilter}
              state={state.draft}
              setMode={setMode}
              control={control}
              watch={watch}
              errors={errors}
            />
          </div>
        );
      default:
        break;
    }
  };

  return (
    <div className=" flex flex-col max-md:py-4 md:p-6 size-full max-md:gap-4 gap-6">
      <div className="flex items-center justify-between border-b-[1.5px] border-stroke-250 max-md:px-4 pb-6">
        <p className="md:text-xl font-bold text-stroke-800">{titles[mode]}</p>
        <button
          disabled={!hasFilters}
          type="button"
          onClick={resetAllFilters}
          className="btn btn--primary--2 disabled:text-stroke-600 border-[1.5px] flex items-center justify-center h-8 md:h-12 gap-2 px-4 text-xs md:text-lg"
        >
          حذف فیلتر ها
        </button>
      </div>
      <div className="h-full overflow-y-auto scrollbar-none">
        {renderTypes()}
      </div>
      <div className="flex items-center justify-between md:justify-end flex-row-reverse gap-4 w-full h-10 sm:h-12 max-md:px-4">
        <button
          type="submit"
          className="btn btn--primary border-none px-6 md:px-18 size-full"
        >
          <p className="text-sm sm:text-base ">اعمال فیلتر</p>
        </button>
        <button
          type="button"
          onClick={mode === "all" ? onClose : () => setMode("all")}
          className="btn btn--secondary--2 px-6 h-full w-1/2 "
        >
          <p className="text-sm sm:text-base">
            {mode === "all" ? "انصراف" : "بازگشت"}
          </p>
        </button>
      </div>
    </div>
  );
}

export default FiltersModal;

function FilterOption({
  state,
  title,
  description,
  openFilter,
  button,
  children,
  resetFilter,
  addFilter,
  data,
  type,
}) {
  const getItem = (item) => {
    if (!Array.isArray(data)) return null;
    switch (type) {
      case "brandIds":
        return data.find((c) => c.id === Number(item));
      case "fragranceFamilies":
      case "seasons":
      case "characters":
      case "occasions":
      case "concentrations":
        return data.find((c) => c.slug === item);
      case "volumes":
        return data.find((c) => c.quantity === Number(item));
    }
  };
  return (
    <div className="flex flex-col items-start justify-start gap-4 p-4 max-md:border-b md:border border-stroke-200 md:rounded-2xl">
      {title && (
        <p className="hidden md:flex font-bold text-stroke-800">{title}</p>
      )}
      {button ? (
        <div className="flex flex-col justify-start gap-2 w-full">
          <div className="flex items-center justify-between gap-2 w-full ">
            <div className="flex flex-col items-start">
              {state?.length ? (
                <Badge
                  title={description}
                  onClick={() => resetFilter("RESET_ONE", type)}
                  error
                />
              ) : (
                <Badge title={description} />
              )}
            </div>
            <button
              type="button"
              onClick={openFilter}
              className="flex items-center justify-end w-full"
            >
              <ChevronLeftIcon className="size-5 text-stroke-800" />
            </button>
          </div>
          {state.length > 0 && (
            <div className="w-full flex flex-wrap items-center justify-start gap-2 ">
              {Array.isArray(state) &&
                state.map((item) => {
                  const itemData = getItem(item);

                  return (
                    <Badge
                      key={`${type}-${item}`}
                      title={
                        itemData?.title ||
                        (type === "volumes"
                          ? `${toPersianNumbers(item)} میل`
                          : String(item))
                      }
                      onClick={() => addFilter("SET_ITEMS", type, item)}
                      error
                    />
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function BrandsFilter({ state, brands, addFilter }) {
  return (
    <div className="flex flex-col justify-between size-full overflow-auto scrollbar-none">
      {brands?.map((brand, index) => {
        const isChecked = state?.includes(brand.id);

        return (
          <div className="flex flex-col w-full">
            <FilterCheckBox
              key={brand.id}
              checkId={brand.value + index}
              label={brand.title}
              imageSrc={brand.iconUrl}
              name={"brandsModalFilter"}
              onChange={() => addFilter("SET_ITEMS", "brandIds", brand.id)}
              checked={isChecked}
              className="flex flex-row-reverse justify-between text-stroke-800 size-full py-4"
              imageClassName="h-6 md:h-8 lg:h-12 w-20 md:w-26 lg:w-32 dark:invert duration-200"
              textClassName="text-base text-wrap"
              checkbox
            />
            <div className="border-t-[1.5px] border-stroke-250"></div>
          </div>
        );
      })}
    </div>
  );
}

export function PriceFilter({ addFilter, control, watch, errors, hidden }) {
  const minPrice = watch("minPrice");
  const maxPrice = watch("maxPrice");

  useEffect(() => {
    addFilter("SET_ITEM", "priceRange", [
      minPrice ? Number(minPrice) : null,
      maxPrice ? Number(maxPrice) : null,
    ]);
  }, [minPrice, maxPrice]);

  return (
    <div className="flex flex-col items-start justify-center w-full gap-4 ">
      <div
        className={`max-md:flex md:hidden items-center justify-start gap-2 w-full`}
      >
        <Badge title="قیمت" />
      </div>
      <div
        className={`
          ${hidden && "max-md:hidden"}
          flex items-center justify-between gap-2 w-full h-fit min-h-11`}
      >
        <div className="flex max-[30rem]:flex-col items-center justify-between gap-2 w-full">
          <RHFTextField
            textClassName="font-bold"
            control={control}
            isPrice={true}
            name="minPrice"
            errors={errors}
            validationSchema={{ deps: ["maxPrice"] }}
            className="w-full px-3"
            placeholder="حداقل"
            containerClassName="size-full *:pr-0"
            isPrimary
          >
            <p>تومان</p>
          </RHFTextField>
          <RHFTextField
            textClassName="font-bold"
            control={control}
            isPrice={true}
            name="maxPrice"
            errors={errors}
            validationSchema={{
              validate: (maxPrice, values) =>
                validatePriceRange(values.minPrice, maxPrice),
            }}
            className="w-full px-3"
            placeholder="حداکثر"
            containerClassName="size-full *:pr-0"
            isPrimary
          >
            <p>تومان</p>
          </RHFTextField>
        </div>
      </div>
    </div>
  );
}

function FragranceFamiliesFilter({
  state,
  fragranceFamilies,
  type,
  addFilter,
}) {
  return (
    <div className="flex flex-col justify-between size-full overflow-auto scrollbar-none">
      {fragranceFamilies?.map((category, index) => {
        const isChecked = state?.includes(category.slug);

        return (
          <div className="flex flex-col w-full">
            <FilterCheckBox
              key={category.id}
              checkId={category.slug + index}
              label={category.title}
              imageSrc={category.iconUrl}
              name={"fragranceFamiliesModalFilter"}
              onChange={() => addFilter("SET_ITEMS", type, category.slug)}
              checked={isChecked}
              className="flex flex-row-reverse justify-between text-nowrap text-stroke-800 size-full py-4"
              imageClassName="flex items-center justify-end py-1 lg:py-2 rounded-full size-12 duration-200"
              textClassName="text-base"
              checkbox
            />
            <div className="border-t-[1.5px] border-stroke-250"></div>
          </div>
        );
      })}
    </div>
  );
}

function VolumesFilter({ state, volumes, type, addFilter }) {
  return (
    <div className="flex flex-col items-start justify-between h-full w-full overflow-auto scrollbar-none">
      {volumes?.map((item, index) => {
        const isChecked = state?.includes(item.quantity);

        return (
          <div className="flex flex-col w-full">
            <FilterCheckBox
              key={item.id}
              checkId={item.value + index}
              label={item.title}
              name="volumesModalFilter"
              onChange={() => addFilter("SET_ITEMS", type, item.quantity)}
              checked={isChecked}
              className="flex flex-row-reverse justify-between text-nowrap text-stroke-800 size-full max-md:py-4 py-6 "
              imageClassName="flex items-center justify-end py-1 lg:py-2 rounded-full wfull size-12 duration-200"
              textClassName="text-base"
              checkbox
            />
            <div className="border-t-[1.5px] border-stroke-250"></div>
          </div>
        );
      })}
    </div>
  );
}

// Single-select Category filter (temperature): selecting the active value
// again, or the clear button, clears it.
function SingleCategoryFilter({
  field,
  label,
  options,
  value,
  addFilter,
  setMode,
  mode,
}) {
  return (
    <div
      className="relative flex flex-wrap items-center gap-2 w-full"
      role="group"
      aria-label={label}
    >
      <div
        className={`flex items-center gap-2 w-full ${mode ? "" : "max-md:hidden"}`}
      >
        {options?.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={value === category.slug}
            onClick={() =>
              addFilter(
                "SET_ITEM",
                field,
                value === category.slug ? null : category.slug,
              )
            }
            className={`rounded-full px-4 py-2 border text-sm w-full ${
              value === category.slug
                ? "border-primary text-primary font-bold"
                : "bg-stroke-150 border-stroke-200 text-stroke-600"
            }`}
          >
            {category.title}
          </button>
        ))}
      </div>
      <div
        className={`flex items-center justify-center w-full ${mode ? "hidden" : "md:hidden"} `}
      >
        {value ? (
          <Badge
            title={`انتخاب ${label} عطر`}
            onClick={() => addFilter("SET_ITEM", field, null)}
            error
          />
        ) : (
          <Badge title={`انتخاب ${label} عطر`} />
        )}
        <button
          type="button"
          onClick={() => setMode(field)}
          className={`flex items-center justify-end gap- w-full `}
        >
          <ChevronLeftIcon className="size-5 text-stroke-800" />
        </button>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => addFilter("SET_ITEM", field, null)}
          className="md:absolute -top-12 left-0 text-sm text-stroke-600 underline max-md:hidden"
        >
          {`پاک کردن ${label}`}
        </button>
      )}
    </div>
  );
}

function VariantTypeFilter({ value, addFilter, setMode, mode }) {
  return (
    <div
      className="relative flex flex-wrap items-center gap-2 w-full"
      role="group"
      aria-label="نوع محصول"
    >
      <div
        className={`flex items-center gap-2 w-full ${mode ? "" : "max-md:hidden"}`}
      >
        {[
          ["decant", "دکانت"],
          ["sealed", "پلمپ"],
        ].map(([type, label]) => (
          <button
            key={type}
            type="button"
            aria-pressed={value === type}
            onClick={() =>
              addFilter("SET_ITEM", "type", value === type ? null : type)
            }
            className={`rounded-full px-4 py-2 border text-sm w-full ${
              value === type
                ? "border-primary text-primary font-bold"
                : "bg-stroke-150 border-stroke-200 text-stroke-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`flex items-center justify-start gap-2 w-full ${mode ? "hidden" : "md:hidden"} `}
      >
        {value ? (
          <Badge
            title="انتخاب نوع محصول"
            onClick={() => addFilter("SET_ITEM", "type", null)}
            error
          />
        ) : (
          <Badge title="انتخاب نوع محصول" />
        )}
        <button
          type="button"
          onClick={() => setMode("type")}
          className={`flex items-center justify-end gap-2 w-full `}
        >
          <ChevronLeftIcon className="size-5 text-stroke-800" />
        </button>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => addFilter("SET_ITEM", "type", null)}
          className="md:absolute -top-12 left-0 text-sm text-stroke-600 underline max-md:hidden"
        >
          پاک کردن نوع
        </button>
      )}
    </div>
  );
}
