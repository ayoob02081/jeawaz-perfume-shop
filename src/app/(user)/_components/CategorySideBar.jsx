"use client";

import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Modal from "@/components/Modal";
import Logo from "@/components/Logo";
import RadioButton from "@/ui/RadioButton";
import ImageFrame from "@/components/ImageFrame";
import { useFilters } from "@/hooks/useFilters";
import {
  useGetAllAccordCategories,
  useGetAllBrandCategories,
  useGetAllGenderCategories,
} from "@/hooks/useCategories";
import { volumes } from "@/constants/filterItems";
import FilterCheckBox from "@/ui/FilterCheckBox";

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
  const { data: accordCategories } = useGetAllAccordCategories();
  const { data: genderCategories } = useGetAllGenderCategories();
  const { data: brandCategories } = useGetAllBrandCategories();

  const { state, dispatch } = useFilters();
  const activeGender = genderCategories?.filter(
    (g) => g.value === state.draft.gender
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
      <div className="size-full md:max-h-[calc(478px) md:overflow-hidden">
        <div className="flex items-center justify-between px-4 w-full py-6 md:hidden md:h-0">
          <button className="size-6" onClick={toggleCategory}>
            <ArrowRightIcon className="size-5" />
          </button>
          <span className="text-text-primary font-bold">دسته بندی محصولات</span>
          <div className="size-5"></div>
        </div>
        <form className="flex max-md:flex-col justify-start md:justify-between md:items-stretch h-full md:h-[470px]  max-md:w-full bg-grey">
          <SideBarCategoryCard
            className="md:hidden"
            fieldsetId="category-section"
          >
            <div className="flex flex-col items-center justify-between h-full md:p-4 md:pl-0">
              <div className="flex md:flex-col items-center max-md:justify-evenly h-full">
                {genderCategories?.map((gender) => {
                  const currectGrnder = state.draft.gender === gender.value;
                  const defaultValue = currectGrnder === true && gender.value;

                  return (
                    <CategoryRadioBtn
                      key={gender.id}
                      className=""
                      radioId={gender.value}
                      name="gender"
                      label={gender.title}
                      src={gender.imageUrl}
                      size="max-md:size-6 md:size-10"
                      chevron="block"
                      defaultValue={defaultValue || null}
                      onChange={() =>
                        addFilter("SET_ITEM", "gender", gender.value)
                      }
                    />
                  );
                })}
              </div>
              <Logo width="w-[5.75rem] h-12" className="md:p-2 max-md:hidden" />
            </div>
          </SideBarCategoryCard>
          {state.draft.gender && (
            <div className="md:hidden bg-white rounded-2xl m-4">
              <Link
                href={"/"}
                className="flex items-center justify-between p-6 text-primary "
              >
                <span>همه عطر های {activeGender[0]?.title}</span>
                <ChevronLeftIcon className="text-primary size-4" />
              </Link>
            </div>
          )}
          <div className="flex flex-col gap-6 md:gap-4 w-full h-full md:h-full max-md:p-4 md:py-4 md:pl-4 max-md:border-t border-stroke ">
            <div className="size-full rounded-2xl bg-white pr- py-4 overflow-hidden">
              <div
                dir="ltr"
                className="flex flex-wrap flex-row-reverse items-start justify-start overflow-y-auto scrollbar--primary scrollbar-w-1 gap-6 pr-4 size-full scroll-smooth **:scroll-smooth"
              >
                <SideBarFilterCard fieldsetId="brand-value" title="برند">
                  {brandCategories?.map((brand) => {
                    const defaultValue = state.draft.brands.filter(
                      (v) => v == brand.value
                    );

                    return (
                      <FilterCheckBox
                        className="flex flex-col items-end justify-start size-full text-xs text-text-secondary has-checked:text-primary has-checked:font-bold duration-200"
                        textClassName="py-2"
                        key={brand.id}
                        checkId={brand.value}
                        name="brands"
                        label={brand.title}
                        checked={defaultValue[0] === brand.value ? true : false}
                        onChange={() =>
                          addFilter("SET_ITEMS", "brands", brand.value)
                        }
                      />
                    );
                  })}
                </SideBarFilterCard>
                <SideBarFilterCard fieldsetId="volume-value" title="حجم">
                  {volumes.map((volume, i) => {
                    const defaultValue = state.draft.volumes.filter(
                      (v) => v == volume.value
                    );

                    return (
                      <FilterCheckBox
                        className="flex flex-col items-end justify-start size-full text-xs text-text-secondary has-checked:text-primary has-checked:font-bold duration-200"
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
                </SideBarFilterCard>
                <SideBarFilterCard fieldsetId="scent-type" title="رایحه">
                  {accordCategories?.map((accord) => {
                    const defaultValue = state.draft.accords.filter(
                      (a) => a === accord.value
                    );
                    return (
                      <FilterCheckBox
                        className="flex flex-col items-end justify-start size-full text-xs text-text-secondary has-checked:text-primary has-checked:font-bold duration-200"
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
                </SideBarFilterCard>
                <SideBarFilterCard fieldsetId="price-range" title="محدوده قیمت">
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
                </SideBarFilterCard>
              </div>
            </div>
            <div className="flex items-center justify-between flex-row-reverse justify-items-center gap-4 max-[30rem]:w-full w-fit md:w-full h-8">
              <button
                type="button"
                disabled={!isFilter && !isPriceFilter ? true : false}
                onClick={() => {
                  submitFilters("APPLY_FILTERS"), setCategoryOpen(false);
                }}
                className="btn btn--primary border-none px-6 md:px-8 size-full"
              >
                <p className="text-sm sm:text-xs ">اعمال فیلتر</p>
              </button>
              <button
                type="button"
                onClick={() => setCategoryOpen(false)}
                className="btn btn--secondary--2 px-6 h-full w-1/2 disabled:bg-amber-50"
              >
                <p className="text-sm sm:text-xs ">انصراف</p>
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default CategorySideBar;

function SideBarFilterCard({ title, fieldsetId, children, className }) {
  return (
    <div
      dir="rtl"
      className={`flex flex-col items-start gap-2 overflow-hidden text-sm h-1/2 ${className}`}
    >
      <div className="flex items-center gap-1">
        <ImageFrame
          src="/images/star-2-primery-icon.svg"
          alt="star icon"
          className="size-4"
        />
        <h5 className="text-text-primary">{title}</h5>
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

function SideBarCategoryCard({ fieldsetId, children }) {
  return (
    <fieldset id={fieldsetId} className="md:rounded-r-3xl md:overflow-hidden">
      <div className="md:h-full max-md:border-t border-stroke-3 md:pt-4 max-md:h-[5.45rem]">
        {children}
      </div>
    </fieldset>
  );
}

function CategoryRadioBtn({
  radioId,
  name,
  label,
  src,
  size,
  chevron,
  className,
  onChange,
  defaultValue,
}) {
  return (
    <RadioButton
      className={`${className} flex max-md:flex-col md:flex-row items-center justify-between max-md:h-full w-[6.75rem] md:w-56 text-xs md:text-sm max-md:rounded-b-lg md:rounded-r-lg max-md:px-2 md:pr-2 py-3 text-text-primary
            has-checked:border max-md:has-checked:border-t-0 md:has-checked:border-l-0 border-primary max-md:has-checked:px-3 has-checked:font-bold has-checked:bg-white has-checked:**:[img]:bg-grey duration-200`}
      id={radioId}
      name={name}
      value={radioId}
      label={label}
      chevron={chevron}
      onChange={onChange}
      checked={defaultValue === radioId ? true : false}
    >
      <ImageFrame
        src={src}
        alt="perfume image"
        className={`felx items-center justify-center rounded-md bg-white ${size} duration-200 overflow-hidden`}
      />
    </RadioButton>
  );
}

function FilterRadioBtn({ radioId, name, label, onChange, defaultValue }) {
  const checked = defaultValue === radioId ? true : false;
  return (
    <RadioButton
      className="flex flex-col items-end justify-start size-full text-xs text-text-secondary has-checked:text-primary has-checked:font-bold duration-200"
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
            checked ? "bg-primary" : "bg-secondary-2"
          } duration-200`}
        ></div>
      </span>
    </RadioButton>
  );
}
