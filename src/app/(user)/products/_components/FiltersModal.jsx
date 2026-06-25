"use client";

import { volumes } from "@/constants/filterItems";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import { useFilters } from "@/hooks/useFilters";
import { Badge } from "@/ui/Badge";
import FilterCheckBox from "@/ui/FilterCheckBox";
import RadioButton from "@/ui/RadioButton";
import RHFTextField from "@/ui/RHFTextField";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

function FiltersModal({
  mode,
  setMode,
  onClose,
  resetAllFilters,
  addFilter,
  resetFilter,
  control,
  watch,
}) {
  const { data: categories, isPending, error } = useGetAllCategories();
  const genderCategories = categories?.filter((c) => c.type === "gender");
  const accordCategories = categories?.filter((c) => c.type === "accord");
  const { data: brandCategories } = useGetAllBrandCategories();

  const { state } = useFilters();

  const isFilter =
    Boolean(state.draft.gender) ||
    state.draft.brandIds?.length > 0 ||
    state.draft.accords?.length > 0 ||
    Boolean(state.draft.inStock) ||
    Boolean(state.draft.original) ||
    state.draft.volumes?.length > 0;

  const isPriceFilter =
    state.draft.priceRange?.[0] !== null ||
    state.draft.priceRange?.[1] !== null;

  const modeTitle = () => {
    switch (mode) {
      case "all":
        return "فیلترها";
      case "brand":
        return "برند";
      case "accord":
        return "رایحه‌";
      case "volume":
        return "حجم‌";
      case "gender":
        return "جنسیت";
      case "price":
        return "قیمت";

      default:
        break;
    }
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
                openFilter={() => setMode("accord")}
                data={accordCategories}
                state={state.draft?.accords}
                addFilter={addFilter}
                resetFilter={resetFilter}
                type="accords"
              />

              <FilterOption title="جنسیت">
                <GendersFilter
                  data={genderCategories}
                  state={state.draft?.gender}
                  setMode={setMode}
                  addFilter={addFilter}
                  resetFilter={resetFilter}
                  hidden
                />
              </FilterOption>
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
                  hidden
                />
              </FilterOption>
              <FilterOption>
                <button
                  type="button"
                  onClick={(e) => {
                    (e.preventDefault(),
                      addFilter(
                        "SET_ITEM",
                        "original",
                        !state?.draft?.original,
                      ));
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
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl px-4 ">
            <BrandsFilter
              brands={brandCategories}
              state={state.draft?.brandIds}
              addFilter={addFilter}
              type="brandIds"
            />
          </div>
        );
      case "accord":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl px-4">
            <AccordsFilter
              accords={accordCategories}
              state={state.draft?.accords}
              addFilter={addFilter}
              type="accords"
            />
          </div>
        );
      case "volume":
        return (
          <div className="flex items-center justify-start gap-6 bg-stroke-0 w-full rounded-2.5xl px-4">
            <VolumesFilter
              volumes={volumes}
              state={state.draft?.volumes}
              addFilter={addFilter}
              type="volumes"
            />
          </div>
        );
      case "gender":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl px-4">
            <GendersFilter
              data={genderCategories}
              state={state.draft?.gender}
              setMode={setMode}
              addFilter={addFilter}
              resetFilter={resetFilter}
            />
          </div>
        );

      case "price":
        return (
          <div className="flex flex-col justify-between gap-6 bg-stroke-0 w-full rounded-2.5xl px-4">
            <PriceFilter
              addFilter={addFilter}
              resetFilter={resetFilter}
              state={state.draft}
              setMode={setMode}
              control={control}
              watch={watch}
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
        <p className="md:text-xl font-bold text-stroke-800">
          {modeTitle(mode)}
        </p>
        <button
          disabled={isFilter || isPriceFilter ? false : true}
          type="button"
          onClick={resetAllFilters}
          className="btn btn--primary--2 disabled:text-stroke-600 border-[1.5px] flex items-center justify-center h-8 md:h-12 gap-2 px-4 text-xs md:text-lg"
        >
          حذف فیلتر ها
        </button>
      </div>
      <div className="h-full max-md:mx-4 overflow-y-auto scrollbar--primary scrollbar-w-2">
        {renderTypes()}
      </div>
      <div className="flex items-center justify-between md:justify-end flex-row-reverse gap-4 w-full h-10 sm:h-12 max-md:px-4">
        <button
          type="submit"
          // disabled={isFilter || isPriceFilter ? false : true}
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
          <div className="w-full flex flex-wrap items-center justify-start gap-2 ">
            {state?.map((item) => {
              const itemData =
                (type === "brandIds" &&
                  data.find((c) => c.id === Number(item))) ||
                (type === "volumes" &&
                  data.find((c) => c.quantity === Number(item))) ||
                (type === "accords" && data.find((c) => c.value === item));
              console.log(itemData.quantity);

              return (
                <Badge
                  key={itemData?.id + itemData?.title}
                  title={itemData?.title}
                  onClick={() => addFilter("SET_ITEM", type, item)}
                  error
                />
              );
            })}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function BrandsFilter({ state, brands, type, addFilter }) {
  return (
    <div className="flex flex-col justify-between gap-6 dark:py-3 dark:pl-4 size-full overflow-auto scrollbar-none">
      {brands?.map((brand, index) => {
        const isChecked = state.includes(brand.id);

        return (
          <FilterCheckBox
            key={brand.id}
            checkId={brand.value + index}
            label={brand.title}
            imageSrc={brand.iconUrl}
            name={"brandsModalFilter"}
            onChange={() => addFilter("SET_ITEMS", "brandIds", brand.id)}
            checked={isChecked}
            className="flex flex-row-reverse justify-between text-stroke-800 size-full"
            imageClassName="h-6 md:h-8 lg:h-12 w-20 md:w-26 lg:w-32 dark:invert duration-200"
            textClassName="text-base text-wrap"
            checkbox
          />
        );
      })}
    </div>
  );
}

export function GendersFilter({
  data,
  state,
  setMode,
  addFilter,
  hidden,
  resetFilter,
}) {
  const GenderHandler = (e) => {
    addFilter("SET_ITEM", "gender", e.target.value);
  };

  return (
    <div className="flex items-center justify-between gap-2 w-full">
      {data?.map((item) => {
        const defaultValue = item.value === state;

        return (
          <RadioButton
            key={item.id}
            id={item.value + item.id}
            value={item.value}
            name="gender"
            checked={defaultValue}
            className={`${
              hidden && "max-md:hidden"
            } flex items-center justify-center px-3 text-sm  h-9 w-full rounded-full duration-200 ${
              defaultValue === true
                ? "border-[1.5px] border-primary text-primary font-bold"
                : "text-stroke-600 bg-stroke-150"
            }`}
            onChange={(e) => GenderHandler(e)}
          >
            {item.title}
          </RadioButton>
        );
      })}
      <div
        className={`flex items-center justify-start gap-2 w-full ${
          hidden ? "md:hidden" : "hidden"
        } `}
      >
        {state?.length ? (
          <Badge
            title="انتخاب جنسیت عطر"
            onClick={() => resetFilter("RESET_ONE", "gender")}
            error
          />
        ) : (
          <Badge title="انتخاب جنسیت عطر" />
        )}
        <button
          type="button"
          onClick={() => setMode("gender")}
          className={`flex items-center justify-end gap-2 w-full `}
        >
          <ChevronLeftIcon className="size-5 text-stroke-800" />
        </button>
      </div>
    </div>
  );
}

export function PriceFilter({ addFilter, control, watch, hidden }) {
  const minPrice = watch("minPrice");
  const maxPrice = watch("maxPrice");

  useEffect(() => {
    addFilter("SET_ITEM", "priceRange", [
      minPrice ? Number(minPrice) : null,
      maxPrice ? Number(maxPrice) : null,
    ]);
  }, [minPrice, maxPrice]);

  return (
    <div className="flex items-center justify-between gap-2 w-full">
      <div
        className={`
          ${hidden && "max-md:hidden"}
             flex items-center justify-between gap-2 w-full h-11`}
      >
        <RHFTextField
          textClassName="font-bold"
          control={control}
          isPrice={true}
          name="minPrice"
          className="rounded-xl w-full px-3"
          placeholder="حداقل"
          containerClassName="size-full *:pr-0"
        >
          <p>تومان</p>
        </RHFTextField>
        <RHFTextField
          textClassName="font-bold"
          control={control}
          isPrice={true}
          name="maxPrice"
          className="rounded-xl w-full px-3"
          placeholder="حداکثر"
          containerClassName="size-full *:pr-0"
        >
          <p>تومان</p>
        </RHFTextField>
      </div>
    </div>
  );
}

function AccordsFilter({ state, accords, type, addFilter }) {
  return (
    <div className="flex flex-col justify-between gap-4 size-full overflow-auto scrollbar-none">
      {accords?.map((accord, index) => {
        const isChecked = state.includes(accord.value);

        return (
          <FilterCheckBox
            key={accord.id}
            checkId={accord.value + index}
            label={accord.title}
            imageSrc={accord.iconUrl}
            name={"accordsModalFilter"}
            onChange={() => addFilter("SET_ITEMS", type, accord.value)}
            checked={isChecked}
            className="flex flex-row-reverse justify-between text-nowrap text-stroke-800 size-full  "
            imageClassName="flex items-center justify-end py-1 lg:py-2 rounded-full wfull size-12 duration-200"
            textClassName="text-base"
            checkbox
          />
        );
      })}
    </div>
  );
}

function VolumesFilter({ state, volumes, type, addFilter }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 h-full py-2 overflow-auto scrollbar-none">
      {volumes?.map((item, index) => {
        const isChecked = state.includes(item.quantity);
        console.log(state, item.quantity, isChecked);

        return (
          <FilterCheckBox
            key={item.id}
            checkId={item.value + index}
            label={item.title}
            name="volumesModalFilter"
            onChange={() => addFilter("SET_ITEMS", type, item.quantity)}
            checked={isChecked}
            className="flex flex-row-reverse justify-between text-nowrap text-stroke-800 size-full  "
            imageClassName="flex items-center justify-end py-1 lg:py-2 rounded-full wfull size-12 duration-200"
            textClassName="text-base"
            checkbox
          />
        );
      })}
    </div>
  );
}
