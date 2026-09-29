"use client";

import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import Modal from "@/components/Modal";
import RadioButton from "@/ui/RadioButton";
import AppImage from "@/components/AppImage";
import { useFilters } from "@/hooks/useFilters";
import {
  useGetAllBrandCategories,
  useGetStorefrontCategoriesByType,
} from "@/hooks/useCategories";
import { useGetProductVolumeOptions } from "@/hooks/useProducts";
import {
  CONCENTRATION_FILTER_LABEL,
  TAXONOMY_FILTER_GROUPS,
  activeFilterCount,
  mergeVolumeOptions,
} from "@/utils/productFilterContract.mjs";
import {
  PRODUCT_CONCENTRATIONS,
  concentrationLabel,
} from "@/utils/productConcentration.mjs";
import FilterCheckBox from "@/ui/FilterCheckBox";
import Loading from "@/components/Loading";
import { buildQueryFromFilters } from "@/utils/queryFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

// The sidebar has its own dedicated gender panel; the generic taxonomy
// columns render every other shared group.
const SIDEBAR_TAXONOMY_GROUPS = TAXONOMY_FILTER_GROUPS.filter(
  ({ key }) => key !== "gender",
);

const priceRanges = [
  {
    id: 1,
    minPrice: 0,
    maxPrice: 999999,
    value: "until-one-million",
    label: "تا یک میلیون",
  },
  {
    id: 2,
    minPrice: 0,
    maxPrice: 3000000,
    value: "until-three-million",
    label: "تا سه میلیون",
  },
  {
    id: 3,
    minPrice: 0,
    maxPrice: 5000000,
    value: "until-five-million",
    label: "تا پنج میلیون",
  },
  {
    id: 4,
    minPrice: 5000001,
    maxPrice: null,
    value: "over-five-million",
    label: "بالای پنج میلیون",
  },
];

function CategorySidebar({ isCategoryOpen, closeCategory }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { data: genderCategories, isPending: isGenderPending } =
    useGetStorefrontCategoriesByType("gender");

  const { data: fragranceFamilyCategories, isPending: isFamilyPending } =
    useGetStorefrontCategoriesByType("fragrance_family");

  const { data: brandCategories, isPending: isBrandPending } =
    useGetAllBrandCategories();

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
  };

  const { state, dispatch } = useFilters();
  const {
    data: volumeResponse,
    isPending: volumesLoading,
    isError: volumesError,
  } = useGetProductVolumeOptions(isCategoryOpen);
  const volumes = mergeVolumeOptions(volumeResponse?.data, state.draft.volumes);

  const isLoadingCategories =
    isGenderPending || isFamilyPending || isBrandPending;

  const activeGender = genderCategories?.find(
    (gender) => gender.slug === state.draft.gender,
  );

  const isFilter = activeFilterCount(state.draft) > 0;

  const isPriceFilter =
    state.draft.priceRange?.[0] !== null ||
    state.draft.priceRange?.[1] !== null;

  function addFilter(actionType, itemKey, itemValue) {
    dispatch({
      type: actionType,
      key: itemKey,
      value: itemValue,
    });
  }

  function submitFilters() {
    const query = buildQueryFromFilters(state.draft, searchParams);

    router.replace(query ? `/products?${query}` : "/products", {
      scroll: false,
    });

    dispatch({
      type: "APPLY_FILTERS",
    });
  }

  function cancelCategory() {
    dispatch({ type: "RESET_DRAFT" });
    closeCategory();
  }

  const selectedBrandIds = Array.isArray(state.draft.brandIds)
    ? state.draft.brandIds.map(Number).filter(Boolean)
    : [];

  return (
    // Mobile: the fixed Backdrop is the only viewport-sized box; the panel
    // fills it (h-full, no second dvh measurement) and [data-scroll] is the
    // single vertical scroller, contained so it never scrolls the page behind.
    <Modal
      isOpen={isCategoryOpen}
      onClose={cancelCategory}
      category
      className="max-lg:h-full"
      backdropClassName="max-lg:overflow-hidden"
    >
      {/* Closed: offscreen and inert (not focusable, hidden from assistive
          technology). Open: a modal dialog. */}
      <div
        data-scroll
        inert={!isCategoryOpen}
        role={isCategoryOpen ? "dialog" : undefined}
        aria-modal={isCategoryOpen ? "true" : undefined}
        aria-label="دسته بندی محصولات"
        className="size-full max-lg:h-full max-lg:overflow-auto overscroll-y-contain lg:overflow-hidden bg-stroke-100 scrollbar-none"
      >
        {/* Mobile Category Button */}
        <div className="fixed top-0 z-10 flex items-center justify-between px-4 w-full py-6 lg:hidden lg:h-0 bg-stroke-0">
          <button
            type="button"
            className="size-6"
            onClick={cancelCategory}
            aria-label="بستن فیلترها"
          >
            <ArrowRightIcon className="size-5 text-stroke-800" />
          </button>
          <span className="text-stroke-800 font-bold">دسته بندی محصولات</span>
          <div className="size-5" />
        </div>

        {isLoadingCategories ? (
          <Loading />
        ) : (
          <form className="flex max-md:flex-col justify-start lg:justify-between lg:items-stretch h-full lg:h-117.5 max-lg:w-full max-lg:pt-18 bg-stroke-100">
            {/* Gender Categories */}
            <GenderCategoriesFilter fieldsetId="category-section">
              <div
                className={`flex flex-col justify-between h-full md:p-4 md:pl-0 ${
                  state.draft.gender ? "items-start" : "items-center"
                } duration-200`}
              >
                <div className="flex md:flex-col items-center max-md:justify-evenly max-sm:gap-4 sm:gap-6 md:gap-2 max-sm:px-4 max-md:px-6 size-full">
                  {genderCategories?.map((gender) => {
                    const isChecked = state.draft.gender === gender.slug;

                    return (
                      <RadioButton
                        key={gender.id}
                        className={`flex max-md:flex-col md:flex-row items-center justify-between max-md:h-full w-full md:w-56 max-[25rem]:text-[10px] max-sm:text-xs border-primary md:text-sm max-md:rounded-b-lg md:rounded-r-lg p-2 text-stroke-800 max-md:text-center duration-200 ${
                          isChecked
                            ? "border max-md:border-t-0 md:border-l-0 font-bold bg-stroke-0"
                            : ""
                        }`}
                        childrenClassName="max-md:flex-col items-center justify-start"
                        id={gender.slug}
                        name="gender"
                        value={gender.slug}
                        label={`ادکلن‌های ${gender.title}`}
                        chevron="md:block size-4"
                        onChange={() =>
                          addFilter("SET_ITEM", "gender", gender.slug)
                        }
                        checked={isChecked}
                      >
                        <div
                          className={`flex items-center justify-center max-sm:size-10 sm:size-14 rounded-md duration-200 overflow-hidden ${
                            isChecked ? "bg-stroke-100" : "bg-stroke-0"
                          }`}
                        >
                          <AppImage
                            src={gender.imageUrl}
                            alt={`${gender.value}-image`}
                            width="max-md:size-8 md:size-10"
                            className="-rotate-12"
                            sizes="10vw"
                          />
                        </div>
                      </RadioButton>
                    );
                  })}
                </div>
                <div className="w-full">
                  <AppImage
                    src="/images/jeawaz-logo-v6.0-r.webp"
                    alt="jeawaz-brand-icon"
                    className="max-md:hidden"
                    width="w-[5.75rem] h-12"
                    sizes="20vw"
                    priority
                  />
                </div>
              </div>
            </GenderCategoriesFilter>

            {/* Mobile Gender Link */}
            {state.draft.gender && (
              <div className="md:hidden bg-stroke-0 rounded-2xl m-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();

                    router.replace(`/products?gender=${activeGender?.slug}`);

                    closeCategory();
                  }}
                  className="flex items-center justify-between p-6 text-primary w-full"
                >
                  <span>همه ادکلن‌های {activeGender?.title}</span>

                  <ChevronLeftIcon className="text-primary size-4" />
                </button>
              </div>
            )}

            {/* Other Categories */}
            <div className="flex flex-col gap-6 md:gap-4 max-md:p-4 md:py-4 md:pl-4 max-lg:w-full max-lg:max-h-svh max-md:border-t border-stroke-200">
              <div className="size-full rounded-2xl bg-stroke-0 py-4 overflow-hidden max-sm:mb-10">
                <div className="flex flex-wrap items-start justify-start size-full overflow-y-auto scrollbar-none gap-6 px-4 scroll-smooth **:scroll-smooth">
                  {/* Brands */}
                  <CategriesFilter fieldsetId="brand-value" title="برند">
                    {brandCategories?.map((brand) => {
                      const isChecked = selectedBrandIds.includes(
                        Number(brand.id),
                      );

                      return (
                        <FilterCheckBox
                          key={`${brand.id}-${brand.title}`}
                          className="flex flex-col items-start justify-start size-full text-xs has-checked:font-bold duration-200"
                          textClassName="py-2"
                          checkId={brand.id}
                          name="brandId"
                          label={brand.title}
                          checked={isChecked}
                          onChange={() =>
                            addFilter("SET_ITEMS", "brandIds", brand.id)
                          }
                        />
                      );
                    })}
                  </CategriesFilter>

                  {/* Volumes */}
                  <CategriesFilter fieldsetId="volume-value" title="حجم">
                    {volumesLoading && (
                      <p className="text-xs text-stroke-600">
                        در حال دریافت حجم‌ها...
                      </p>
                    )}
                    {volumesError && (
                      <p className="text-xs text-stroke-600">
                        دریافت حجم‌ها ناموفق بود؛ انتخاب‌ها حفظ شده‌اند.
                      </p>
                    )}
                    {!volumesLoading &&
                      !volumesError &&
                      volumes.length === 0 && (
                        <p className="text-xs text-stroke-600">
                          حجمی برای انتخاب موجود نیست.
                        </p>
                      )}
                    {volumes.map((volume) => {
                      const isChecked = state.draft.volumes.includes(volume);

                      return (
                        <FilterCheckBox
                          key={volume}
                          className="flex flex-col items-start justify-start size-full text-xs has-checked:font-bold duration-200"
                          textClassName="py-2 flex flex-row-reverse"
                          checkId={volume}
                          name="volume"
                          label={`${toPersianNumbers(volume)} میل`}
                          checked={isChecked}
                          onChange={() =>
                            addFilter("SET_ITEMS", "volumes", volume)
                          }
                        />
                      );
                    })}
                  </CategriesFilter>

                  <CategriesFilter fieldsetId="variant-type" title="نوع محصول">
                    {[
                      ["decant", "دکانت"],
                      ["sealed", "پلمپ"],
                    ].map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={state.draft.type === type}
                        onClick={() =>
                          addFilter(
                            "SET_ITEM",
                            "type",
                            state.draft.type === type ? null : type,
                          )
                        }
                        className={`py-2 text-xs ${
                          state.draft.type === type
                            ? "text-primary font-bold"
                            : "text-stroke-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </CategriesFilter>

                  {/* Fragrance families */}
                  <CategriesFilter fieldsetId="scent-type" title="رایحه">
                    {fragranceFamilyCategories?.map((family) => {
                      const isChecked = state.draft.fragranceFamilies.includes(
                        family.slug,
                      );

                      return (
                        <FilterCheckBox
                          key={family.id}
                          className="flex flex-col items-start justify-start size-full text-xs has-checked:font-bold duration-200"
                          textClassName="py-2"
                          checkId={family.slug}
                          name="fragranceFamily"
                          label={family.title}
                          checked={isChecked}
                          onChange={() =>
                            addFilter(
                              "SET_ITEMS",
                              "fragranceFamilies",
                              family.slug,
                            )
                          }
                        />
                      );
                    })}
                  </CategriesFilter>

                  {/* Product V2 taxonomy */}
                  {SIDEBAR_TAXONOMY_GROUPS.map(({ key, label, multiple }) => (
                    <CategriesFilter key={key} fieldsetId={`${key}-value`} title={label}>
                      {taxonomyOptions[key]?.map((category) =>
                        multiple ? (
                          <FilterCheckBox
                            key={category.id}
                            className="flex flex-col items-start justify-start size-full text-xs has-checked:font-bold duration-200"
                            textClassName="py-2"
                            checkId={`${key}-${category.slug}`}
                            name={key}
                            label={category.title}
                            checked={state.draft[key].includes(category.slug)}
                            onChange={() =>
                              addFilter("SET_ITEMS", key, category.slug)
                            }
                          />
                        ) : (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={state.draft[key] === category.slug}
                            onClick={() =>
                              addFilter(
                                "SET_ITEM",
                                key,
                                state.draft[key] === category.slug
                                  ? null
                                  : category.slug,
                              )
                            }
                            className={`py-2 text-xs ${
                              state.draft[key] === category.slug
                                ? "text-primary font-bold"
                                : "text-stroke-600"
                            }`}
                          >
                            {category.title}
                          </button>
                        ),
                      )}
                    </CategriesFilter>
                  ))}

                  {/* Concentration */}
                  <CategriesFilter
                    fieldsetId="concentrations-value"
                    title={CONCENTRATION_FILTER_LABEL}
                  >
                    {PRODUCT_CONCENTRATIONS.map((value) => (
                      <FilterCheckBox
                        key={value}
                        className="flex flex-col items-start justify-start size-full text-xs has-checked:font-bold duration-200"
                        textClassName="py-2"
                        checkId={`concentrations-${value}`}
                        name="concentrations"
                        label={concentrationLabel(value)}
                        checked={state.draft.concentrations.includes(value)}
                        onChange={() =>
                          addFilter("SET_ITEMS", "concentrations", value)
                        }
                      />
                    ))}
                  </CategriesFilter>

                  {/* Price */}
                  <CategriesFilter
                    fieldsetId="price-range"
                    title="محدوده قیمت"
                    className="md:pl-4"
                  >
                    {priceRanges.map((price) => {
                      const checked =
                        state.draft.priceRange?.[0] === price.minPrice &&
                        state.draft.priceRange?.[1] === price.maxPrice;

                      return (
                        <FilterRadioBtn
                          key={price.id}
                          radioId={price.value}
                          name="price"
                          label={price.label}
                          checked={checked}
                          onChange={() =>
                            addFilter("SET_ITEM", "priceRange", [
                              price.minPrice,
                              price.maxPrice,
                            ])
                          }
                        />
                      );
                    })}
                  </CategriesFilter>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-start md:justify-end w-full">
                <div className="max-sm:fixed max-sm:bottom-4 max-sm:inset-x-0 max-sm:px-4 flex items-center justify-between justify-items-center gap-4 max-[30rem]:w-full w-fit h-8">
                  <button
                    type="button"
                    disabled={!isFilter && !isPriceFilter}
                    onClick={() => {
                      submitFilters();
                      closeCategory();
                    }}
                    className="btn btn--primary shadow-xl border-none px-6 md:px-8 size-full"
                  >
                    <p className="text-sm sm:text-xs">اعمال فیلتر</p>
                  </button>

                  <button
                    type="button"
                    onClick={cancelCategory}
                    className="btn btn--secondary--2 shadow-xl bg-stroke-0 border-stroke-0 px-6 h-full w-1/2 disabled:bg-amber-50"
                  >
                    <p className="text-sm sm:text-xs text-stroke-800">انصراف</p>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export default CategorySidebar;

function CategriesFilter({ title, fieldsetId, children, className = "" }) {
  return (
    <div
      className={`flex flex-col items-end justify-start gap-2 overflow-hidden text-sm h-full max-h-1/2 ${className}`}
    >
      <div className="flex justify-start items-center gap-1 w-full">
        <AppImage
          src="/images/star-2-primery-icon.svg"
          alt="star-icon"
          width="size-4"
          sizes="10vw"
        />
        <h5 className="text-stroke-800">{title}</h5>
      </div>
      <fieldset
        id={fieldsetId}
        className="flex flex-col items-start w-full overflow-y-auto scrollbar-none"
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

function FilterRadioBtn({ radioId, name, label, onChange, checked }) {
  return (
    <RadioButton
      className="flex flex-col items-start justify-start size-full text-xs text-stroke-600 dark:text-stroke-500 has-checked:text-primary has-checked:font-bold duration-200"
      id={radioId}
      name={name}
      value={radioId}
      onChange={onChange}
      checked={checked}
    >
      <span className="flex items-center justify-start gap-1">
        <div
          className={`h-2 w-0.5 rounded-full ${
            checked ? "bg-primary" : "bg-stroke-50"
          } duration-200`}
        />
        <p className="py-2">{label}</p>
      </span>
    </RadioButton>
  );
}
