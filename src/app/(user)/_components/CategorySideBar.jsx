"use client";

import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Modal from "@/components/Modal";
import RadioButton from "@/ui/RadioButton";
import AppImage from "@/components/AppImage";
import { useFilters } from "@/hooks/useFilters";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import { volumes } from "@/constants/filterItems";
import FilterCheckBox from "@/ui/FilterCheckBox";
import Loading from "@/components/Loading";

const priceRanges = [
  {
    id: 1,
    fromPrice: 0,
    toPrice: 999999,
    value: "until-one-million",
    label: "تا یک میلیون",
  },
  {
    id: 2,
    fromPrice: 0,
    toPrice: 3000000,
    value: "until-three-million",
    label: "تا سه میلیون",
  },
  {
    id: 3,
    fromPrice: 0,
    toPrice: 5000000,
    value: "until-five-million",
    label: "تا پنج میلیون",
  },
  {
    id: 4,
    fromPrice: 5000001,
    toPrice: 199999999,
    value: "over-five-million",
    label: "بالای پنج میلیون",
  },
];

function CategorySideBar({
  toggleCategory,
  categoryOpen,
  setCategoryOpen,
  onClose,
}) {
  const { data: categories, isPending, error } = useGetAllCategories();
  const genderCategories = categories?.filter((c) => c.type === "gender");
  const accordCategories = categories?.filter((c) => c.type === "accord");
  const { data: brandCategories } = useGetAllBrandCategories();

  const { state, dispatch } = useFilters();
  const activeGender = genderCategories?.filter(
    (g) => g.value === state.draft.gender,
  );

  const isFilter =
    (state.draft.gender?.length ||
      state.draft.brands?.length ||
      state.draft.accords?.length ||
      state.draft.inStock?.length ||
      state.draft.isOriginal?.length ||
      state.draft.volumes?.length) > 0;

  const isPriceFilter = state.draft.priceRange[1] !== 300000000;

  function addFilter(actionType, itemKey, itemValue) {
    dispatch({ type: actionType, key: itemKey, value: itemValue });
  }

  function resetFilter(actionType, itemKey) {
    dispatch({ type: actionType, key: itemKey });
  }

  function submitFilters(actionType) {
    dispatch({ type: actionType });
  }

  return (
    <Modal isOpen={categoryOpen} onClose={onClose} category>
      <div className="size-full max-md:h-screen max-md:overflow-auto md:overflow-hidden bg-stroke-100">
        {/* Mobile Category Button */}
        <div className="flex items-center justify-between px-4 w-full py-6 md:hidden md:h-0 bg-stroke-0">
          <button className="size-6" onClick={toggleCategory}>
            <ArrowRightIcon className="size-5 text-stroke-800" />
          </button>
          <span className="text-stroke-800 font-bold">دسته بندی محصولات</span>
          <div className="size-5"></div>
        </div>

        {/* Category Form */}
        {isPending && <Loading />}
        {!isPending && (
          <form className="flex max-md:flex-col justify-start md:justify-between md:items-stretch h-full md:h-[470px] max-md:w-full bg-stroke-100">
            {/* Gender Categories */}
            <GenderCategoriesFilter fieldsetId="category-section">
              <div
                className={`flex flex-col justify-between h-full md:p-4 ${state.draft.gender ? "md:pl-0 items-start" : "items-center"} duration-200`}
              >
                <div className="flex md:flex-col items-center max-md:justify-evenly max-sm:gap-4 sm:gap-6 md:gap-2 max-sm:px-4 max-md:px-6 size-full">
                  {genderCategories?.map((gender) => {
                    const currectGrnder = state.draft.gender === gender.value;
                    const defaultValue = currectGrnder === true && gender.value;
                    return (
                      <RadioButton
                        key={gender.id}
                        className="flex max-md:flex-col md:flex-row items-center justify-between max-md:h-full w-full md:w-56 max-sm:text-xs
                    border-primary md:text-sm max-md:rounded-b-lg md:rounded-r-lg p-2 text-stroke-800 *:[div]:bg-stroke-0
                      has-checked:border max-md:has-checked:border-t-0 md:has-checked:border-l-0 has-checked:font-bold
                    has-checked:bg-stroke-0 has-checked:*:[div]:bg-stroke-100 duration-200"
                        id={gender.value}
                        name={"gender"}
                        value={gender.value}
                        label={"عطرهای " + gender.title}
                        chevron="md:block size-4"
                        onChange={() =>
                          addFilter("SET_ITEM", "gender", gender.value)
                        }
                        checked={
                          defaultValue || null === gender.value ? true : false
                        }
                      >
                        <div className="flex items-center justify-center max-sm:size-10 sm:size-14 rounded-md duration-200 overflow-hidden">
                          <AppImage
                            src={gender.imageUrl}
                            alt={gender.value + `-image`}
                            width={"max-md:size-8 md:size-10"}
                            className="-rotate-12"
                            sizes="10vw"
                          />
                        </div>
                      </RadioButton>
                    );
                  })}
                </div>
                <AppImage
                  src="/images/Jeaawaz-Logo-red-v5.0.webp"
                  alt="jeawaz-brand-icon"
                  className=" max-md:hidden"
                  width="w-[5.75rem] h-12"
                  sizes="20vw"
                />
              </div>
            </GenderCategoriesFilter>
            {state.draft.gender && (
              <div className="md:hidden bg-stroke-0 rounded-2xl m-4">
                <Link
                  href={"/"}
                  className="flex items-center justify-between p-6 text-primary "
                >
                  <span>همه عطر های {activeGender[0]?.title}</span>
                  <ChevronLeftIcon className="text-primary size-4" />
                </Link>
              </div>
            )}

            {/* Other Categories */}
            {state.draft.gender && (
              <div className="flex flex-col gap-6 md:gap-4 w-full h-ful max-md:p-4 md:py-4 md:pl-4 max-md:border-t border-stroke-200 ">
                {/* Categories */}
                <div className="size-full rounded-2xl bg-stroke-0 py-4 overflow-hidden">
                  <div
                    dir="ltr"
                    className="flex flex-wrap flex-row-reverse items-start justify-start size-full overflow-y-auto scrollbar-none gap-6 pr-4 scroll-smooth **:scroll-smooth"
                  >

                    {/* Brands Filter */}
                    <CategriesFilter fieldsetId="brand-value" title="برند">
                      {brandCategories?.map((brand) => {
                        const defaultValue = state.draft.brands.filter(
                          (v) => v == brand.value,
                        );

                        return (
                          <FilterCheckBox
                            className="flex flex-col items-end justify-start size-full text-xs has-checked:font-bold duration-200"
                            textClassName="py-2"
                            key={brand.id}
                            checkId={brand.value}
                            name="brands"
                            label={brand.title}
                            checked={
                              defaultValue[0] === brand.value ? true : false
                            }
                            onChange={() =>
                              addFilter("SET_ITEMS", "brands", brand.value)
                            }
                          />
                        );
                      })}
                    </CategriesFilter>
                    
                    {/* Volumes Filter */}
                    <CategriesFilter fieldsetId="volume-value" title="حجم">
                      {volumes.map((volume, i) => {
                        const defaultValue = state.draft.volumes.filter(
                          (v) => v == volume.value,
                        );

                        return (
                          <FilterCheckBox
                            className="flex flex-col items-end justify-start size-full text-xs has-checked:font-bold duration-200"
                            textClassName="py-2"
                            key={volume.id}
                            checkId={volume.value}
                            name="volume"
                            label={volume.title}
                            checked={
                              defaultValue[0] === volume.value ? true : false
                            }
                            onChange={() =>
                              addFilter("SET_ITEMS", "volumes", volume.value)
                            }
                          />
                        );
                      })}
                    </CategriesFilter>
                  
                    {/* Accords Filter */}
                    <CategriesFilter fieldsetId="scent-type" title="رایحه">
                      {accordCategories?.map((accord) => {
                        const defaultValue = state.draft.accords.filter(
                          (a) => a === accord.value,
                        );
                        return (
                          <FilterCheckBox
                            className="flex flex-col items-end justify-start size-full text-xs has-checked:font-bold duration-200"
                            textClassName="py-2"
                            key={accord.id}
                            checkId={accord.value}
                            name="accord"
                            label={accord.title}
                            checked={
                              defaultValue[0] === accord.value ? true : false
                            }
                            onChange={() =>
                              addFilter("SET_ITEMS", "accords", accord.value)
                            }
                          />
                        );
                      })}
                    </CategriesFilter>
                   
                    {/* Price Filter */}
                    <CategriesFilter
                      fieldsetId="price-range"
                      title="محدوده قیمت"
                      className="md:pl-4"
                    >
                      {priceRanges.map((price) => {
                        const isExisted =
                          state.draft.priceRange[1] === price.toPrice;
                        const defaultValue = isExisted && price;

                        return (
                          <FilterRadioBtn
                            key={price.id}
                            radioId={price.value}
                            name="price"
                            label={price.label}
                            defaultValue={defaultValue.value}
                            onChange={() =>
                              addFilter("SET_ITEM", "priceRange", [
                                price.fromPrice,
                                price.toPrice,
                              ])
                            }
                          />
                        );
                      })}
                    </CategriesFilter>
                  </div>
                </div>

                {/* Categories Submit Button */}
                <div className="flex items-center justify-start md:justify-end w-full">
                  <div className="flex items-center justify-between  justify-items-center gap-4 max-[30rem]:w-full w-fit md:-full h-8">
                    <button
                      type="button"
                      disabled={!isFilter && !isPriceFilter ? true : false}
                      onClick={() => {
                        (submitFilters("APPLY_FILTERS"),
                          setCategoryOpen(false));
                      }}
                      className="btn btn--primary border-none px-6 md:px-8 size-full"
                    >
                      <p className="text-sm sm:text-xs ">اعمال فیلتر</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(false)}
                      className="btn btn--secondary--2 bg-stroke-0 border-stroke-0 px-6 h-full w-1/2 disabled:bg-amber-50"
                    >
                      <p className="text-sm sm:text-xs text-stroke-800">
                        انصراف
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
}

export default CategorySideBar;

function CategriesFilter({ title, fieldsetId, children, className }) {
  return (
    <div
      dir="rtl"
      className={`flex flex-col items-start gap-2 overflow-hidden text-sm h-full max-h-1/2 ${className}`}
    >
      <div className="flex items-center gap-1">
        <AppImage
          src="/images/star-2-primery-icon.svg"
          alt="star-icon"
          width="size-4"
          sizes="10vw"
        />
        <h5 className="text-stroke-800">{title}</h5>
      </div>
      <fieldset
        dir="ltr"
        id={fieldsetId}
        className="flex flex-col items-end pr-2 size-full overflow-y-auto scrollbar--primary scrollbar-w-1"
      >
        {children}
      </fieldset>
    </div>
  );
}

function GenderCategoriesFilter({ fieldsetId, children }) {
  return (
    <fieldset id={fieldsetId} className="md:rounded-r-3xl md:overflow-hidden">
      <div className="md:h-full max-md:border-t border-stroke-300 md:pt-4 max-sm:h-[5.45rem] sm:h-28">
        {children}
      </div>
    </fieldset>
  );
}

function FilterRadioBtn({ radioId, name, label, onChange, defaultValue }) {
  const checked = defaultValue === radioId ? true : false;
  return (
    <RadioButton
      className="flex flex-col items-end justify-start size-full text-xs text-stroke-600 dark:text-stroke-500 has-checked:text-primary has-checked:font-bold duration-200"
      id={radioId}
      name={name}
      value={radioId}
      onChange={onChange}
      checked={checked}
    >
      <span className="flex items-center justify-start gap-1">
        <p className="py-2">{label}</p>
        <div
          className={`h-2 w-0.5 rounded-full ${
            checked ? "bg-primary" : "bg-stroke-50"
          } duration-200`}
        ></div>
      </span>
    </RadioButton>
  );
}
