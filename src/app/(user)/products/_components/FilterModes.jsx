"use client";

import { volumes } from "@/constants/filterItems";
import {
  useGetAllAccordCategories,
  useGetAllBrandCategories,
  useGetAllGenderCategories,
} from "@/hooks/useCategories";
import { useFilters } from "@/hooks/useFilters";
import { Badge } from "@/ui/Badge";
import FilterCheckBox from "@/ui/FilterCheckBox";
import RadioButton from "@/ui/RadioButton";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function FilterModes({
  mode,
  setMode,
  onClose,
  applyFilter,
  resetAllFilters,
  addFilter,
  resetFilter,
}) {
  const { data: genderCategories } = useGetAllGenderCategories();
  const { data: brandsCategories } = useGetAllBrandCategories();
  const { data: accordsCategories } = useGetAllAccordCategories();

  const { state } = useFilters();

  const isFilter =
    (state.draft.gender?.length ||
      state.draft.brands?.length ||
      state.draft.accords?.length ||
      state.draft.inStock?.length ||
      state.draft.isOriginal?.length ||
      state.draft.volumes?.length) > 0;

  const isPriceFilter = state.draft.priceRange[1] !== 300000000;

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

      default:
        break;
    }
  };

  const renderModes = () => {
    switch (mode) {
      case "all":
        return (
          <div className="flex flex-col justify-between gap-6 bg-white w-full rounded-2.5xl md:pl-3 md:py-">
            <div className="flex flex-col justify-between md:gap-4">
              <FilterMode
                button
                title="برند"
                description=" انتخاب برند عطر"
                openFilter={() => setMode("brand")}
                data={brandsCategories}
                state={state.draft?.brands}
                addFilter={addFilter}
                resetFilter={resetFilter}
                type="brands"
              />
              <FilterMode
                button
                title="رایحه"
                description=" انتخاب رایحه عطر"
                openFilter={() => setMode("accord")}
                data={accordsCategories}
                state={state.draft?.accords}
                addFilter={addFilter}
                resetFilter={resetFilter}
                type="accords"
              />

              <FilterMode title="جنسیت">
                <GendersFilter
                  data={genderCategories}
                  description={"انتخاب جنسیت عطر"}
                  type={"gender"}
                  state={state.draft?.gender}
                  setMode={setMode}
                  addFilter={addFilter}
                  resetFilter={resetFilter}
                  hidden
                />
              </FilterMode>
              <FilterMode
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
            </div>
          </div>
        );

      case "brand":
        return (
          <div className="flex flex-col justify-between gap-6 bg-white w-full rounded-2.5xl px-4 ">
            <BrandsFilter
              brands={brandsCategories}
              state={state.draft?.brands}
              addFilter={addFilter}
              type="brands"
            />
          </div>
        );
      case "accord":
        return (
          <div className="flex flex-col justify-between gap-6 bg-white w-full rounded-2.5xl px-4">
            <AccordsFilter
              accords={accordsCategories}
              state={state.draft?.accords}
              addFilter={addFilter}
              type="accords"
            />
          </div>
        );
      case "volume":
        return (
          <div className="flex items-center justify-start gap-6 bg-white w-full rounded-2.5xl px-4">
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
          <div className="flex flex-col justify-between gap-6 bg-white w-full rounded-2.5xl px-4">
            <GendersFilter
              data={genderCategories}
              description={"انتخاب جنسیت عطر"}
              type={"gender"}
              state={state.draft?.gender}
              setMode={setMode}
              addFilter={addFilter}
              resetFilter={resetFilter}
            />
          </div>
        );
      default:
        break;
    }
  };

  return (
    <div className=" flex flex-col max-md:py-4 md:p-6 size-full max-md:gap-4 gap-6">
      <div className="flex items-center justify-between border-b-[1.5px] border-stroke-2 max-md:px-4 pb-6">
        <p className="md:text-xl font-bold ">{modeTitle(mode)}</p>
        <button
          disabled={isFilter || isPriceFilter ? false : true}
          type="button"
          onClick={resetAllFilters}
          className="btn btn--primary--2 disabled:text-text-secondary border-[1.5px] flex items-center justify-center h-8 md:h-12 gap-2 px-4 text-xs md:text-lg"
        >
          حذف فیلتر ها
        </button>
      </div>
      <div className="h-full max-md:mx-4 overflow-y-auto scrollbar--primary scrollbar-w-2">
        {renderModes()}
      </div>
      <div className="flex items-center justify-between md:justify-end flex-row-reverse gap-4 w-full h-10 sm:h-12 max-md:px-4">
        <button
          type="button"
          onClick={applyFilter}
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
          <p className="text-sm sm:text-base ">
            {mode === "all" ? "انصراف" : "بازگشت"}
          </p>
        </button>
      </div>
    </div>
  );
}

export default FilterModes;

function FilterMode({
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
    <div className="flex flex-col items-start justify-start gap-4 p-4 max-md:border-b md:border border-stroke md:rounded-2xl">
      <p className="hidden md:flex font-bold">{title}</p>
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
              <ChevronLeftIcon className="size-5 text-text" />
            </button>
          </div>
          <div className="w-full flex flex-wrap items-center justify-start gap-2 ">
            {state?.map((item) => {
              const itemTitle = data.filter((c) => {
                const itemInCategory = c.value === item;
                return itemInCategory;
              });

              return (
                <Badge
                  key={itemTitle[0].id + itemTitle[0].title}
                  title={itemTitle[0].title}
                  onClick={() => addFilter("SET_ITEMS", type, item)}
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
    <div className="flex flex-col justify-between gap-6 size-full overflow-auto scrollbar-none">
      {brands?.map((brand, index) => {
        const isChecked = state.includes(brand.value);

        return (
          <FilterCheckBox
            key={brand.id}
            checkId={brand.value + index}
            label={brand.title}
            imageSrc={brand.iconUrl}
            name={"brandFilter2"}
            onChange={() => addFilter("SET_ITEMS", type, brand.value)}
            checked={isChecked}
            className="flex flex-row-reverse justify-between text-text-primary size-full "
            imageClassName=" h-6 md:h-8 lg:h-12 w-20 md:w-26 lg:w-32 duration-200"
            textClassName="text-base text-wrap"
            checkbox
          />
        );
      })}
    </div>
  );
}

function GendersFilter({
  data,
  state,
  setMode,
  addFilter,
  hidden,
  resetFilter,
}) {
  return (
    <div className="flex items-center justify-between gap-2 w-full">
      {data?.map((item) => {
        const defaultValue = item.value === state;
        return (
          <RadioButton
            key={item.id}
            id={item.id}
            name={item.value}
            checked={defaultValue}
            className={`${
              hidden && "max-md:hidden"
            } flex items-center justify-center px-3 text-sm  h-9 w-full rounded-full duration-200 ${
              defaultValue === true
                ? "border-[1.5px] border-primary text-primary font-bold"
                : "text-text-secondary bg-secondary"
            }`}
            onChange={() => addFilter("SET_ITEM", "gender", item.value)}
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
        <div
          onClick={() => setMode("gender")}
          className={`flex items-center justify-end gap-2 w-full `}
        >
          <ChevronLeftIcon className="size-5 text-text" />
        </div>
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
            name={"accordFilter2"}
            onChange={() => addFilter("SET_ITEMS", type, accord.value)}
            checked={isChecked}
            className="flex flex-row-reverse justify-between text-nowrap text-text-primary size-full  "
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
      {volumes?.map((volume, index) => {
        const isChecked = state.includes(volume.value);

        return (
          <FilterCheckBox
            key={volume.id}
            checkId={volume.value + index + index}
            label={volume.title}
            // imageSrc={volume.iconUrl}
            name="volumeFilter2"
            onChange={() => addFilter("SET_ITEMS", type, volume.value)}
            checked={isChecked}
            className="flex flex-row-reverse justify-between text-nowrap text-text-primary size-full  "
            imageClassName="flex items-center justify-end py-1 lg:py-2 rounded-full wfull size-12 duration-200"
            textClassName="text-base"
            checkbox
          />
        );
      })}
    </div>
  );
}
