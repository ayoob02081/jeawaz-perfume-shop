"use client";

import AppImage from "@/components/AppImage";
import { Badge } from "@/ui/Badge";
import BreadCrumbBase from "@/ui/BreadCrumbBase";
import BreadCrumb from "@/ui/BreadCrumb";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Modal from "@/components/Modal";
import { useFilters } from "@/hooks/useFilters";
import SortSection from "@/components/SortSection";
import FilterCheckBox from "@/ui/FilterCheckBox";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { emptyFilters } from "@/contexts/filters/initialStateFilters";
import FiltersModal from "./FiltersModal";
import {
  buildQueryFromFilters,
  getFiltersFromSearchParams,
} from "@/utils/queryFilters";
import {
  TAXONOMY_FILTER_GROUPS,
  categoryBadgeTitle,
  priceFormValues,
  productListHeading,
  withoutFilterValue,
} from "@/utils/productFilterContract.mjs";
import { concentrationLabel } from "@/utils/productConcentration.mjs";
import { useForm } from "react-hook-form";
import Skeleton from "@/ui/Skeleton";
import { scrollTo } from "@/utils/scrollTo";

function FilterSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const { state, dispatch } = useFilters();

  const brandsRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("all");

  const {
    data: brands,
    isLoading: brandsLoading,
    error,
  } = useGetAllBrandCategories();
  const { data: categories, isLoading: categoriesLoading } =
    useGetAllCategories();
  const filtersFromUrl = getFiltersFromSearchParams(searchParams);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: priceFormValues(filtersFromUrl.priceRange),
  });

  function addFilter(actionType, itemKey, itemValue) {
    dispatch({ type: actionType, key: itemKey, value: itemValue });
  }

  function resetFilter(actionType, itemKey) {
    dispatch({ type: actionType, key: itemKey });
  }

  function submitFilters(actionType) {
    dispatch({ type: actionType });
  }

  const ToggleModal = () => {
    if (isModalOpen) CloseModal();
    else setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setMode("all");
    dispatch({ type: "RESET_DRAFT" });
  };

  // Cancel/close without Apply: the price inputs (react-hook-form, copied into
  // the draft by PriceFilter) go back to the applied URL value too, so a
  // cancelled price cannot re-enter the draft when the modal is used again.
  const CloseModal = () => {
    hideModal();
    reset(priceFormValues(filtersFromUrl.priceRange));
  };

  const HandleSubmitfilter = () => {
    applyFilter();
  };

  // Apply keeps the entered price; the URL change re-hydrates the form.
  function applyFilter() {
    const query = buildQueryFromFilters(state.draft, searchParams);

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    dispatch({ type: "APPLY_FILTERS" });
    hideModal();
  }

  function resetAllFilters() {
    setMode("all");

    reset({
      minPrice: null,
      maxPrice: null,
    });

    const query = buildQueryFromFilters(emptyFilters, searchParams);
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    dispatch({ type: "RESET_ALL_APPLY" });
  }

  function resetOneAndSync(key) {
    const newDraft = {
      ...filtersFromUrl,
      [key]: emptyFilters[key],
    };
    if (key === "volumes") {
      newDraft.minVolume = null;
      newDraft.maxVolume = null;
    }
    if (key === "priceRange") reset({ minPrice: null, maxPrice: null });

    const query = buildQueryFromFilters(newDraft, searchParams);

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    dispatch({ type: "RESET_ONE_APPLY", key });
  }

  // Removes one selected value (or the single temperature) immediately.
  function removeValueAndSync(key, value) {
    const next = withoutFilterValue(filtersFromUrl, key, value);
    const query = buildQueryFromFilters(next, searchParams);

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    dispatch({ type: "SET_ITEM_APPLY", key, value: next[key] });
  }

  useEffect(() => {
    dispatch({
      type: "HYDRATE_FROM_URL",
      payload: filtersFromUrl,
    });

    reset(priceFormValues(filtersFromUrl.priceRange));
  }, [search, dispatch, reset]);

  function toggleBrandAndSync(brandId) {
    const currentBrandIds = filtersFromUrl.brandIds || [];

    const exists = currentBrandIds.some((id) => Number(id) === Number(brandId));

    const newBrandIds = exists
      ? currentBrandIds.filter((id) => Number(id) !== Number(brandId))
      : [...currentBrandIds, Number(brandId)];

    dispatch({
      type: "TOGGLE_ITEM_APPLY",
      key: "brandIds",
      value: Number(brandId),
    });

    const newDraft = {
      ...filtersFromUrl,
      brandIds: newBrandIds,
    };

    const query = buildQueryFromFilters(newDraft, searchParams);

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <article>
      <div className="border-b border-stroke-200">
        <section className="flex flex-col items-start justify-between size-full gap-6 max-md:pb-4 max-md:pt-3">
          <div className="w-full ">
            <section className="flex items-center justify-start gap-2 snap-x overflow-x-scroll scrollbar-none w-full">
              {/* Filters Modal Button */}
              <button
                onClick={ToggleModal}
                className="flex items-center justify-between gap-2 rounded-5xl border-[1.5px] border-stroke-200 dark:border-stroke-800/60 max-md:h-8 md:h-11 snap-center px-4"
              >
                <AppImage
                  src="/images/filter-icon.svg"
                  alt="filter-icon"
                  sizes="10vw"
                  width="size-5"
                  className="dark:invert"
                />
                <p className="max-md:text-xs text-stroke-800">فیلترها</p>
              </button>

              {/* Filters Badge */}
              {(filtersFromUrl?.priceRange[0] !== null ||
                filtersFromUrl?.priceRange[1] !== null) && (
                <Badge
                  title="قیمت"
                  onClick={() => resetOneAndSync("priceRange")}
                  error
                />
              )}
              {filtersFromUrl?.fragranceFamilies.length > 0 && (
                <Badge
                  title="رایحه"
                  onClick={() => resetOneAndSync("fragranceFamilies")}
                  error
                />
              )}
              {filtersFromUrl?.brandIds.length > 0 && (
                <Badge
                  title="برند"
                  onClick={() => resetOneAndSync("brandIds")}
                  error
                />
              )}
              {filtersFromUrl?.volumes.length > 0 && (
                <Badge
                  title="حجم"
                  onClick={() => resetOneAndSync("volumes")}
                  error
                />
              )}
              {filtersFromUrl?.type && (
                <Badge
                  title={filtersFromUrl.type === "sealed" ? "پلمپ" : "دکانت"}
                  onClick={() => resetOneAndSync("type")}
                  error
                />
              )}
              {filtersFromUrl?.original && (
                <Badge
                  title="اورجینال"
                  onClick={() => resetOneAndSync("original")}
                  error
                />
              )}
              {filtersFromUrl?.inStock && (
                <Badge
                  title="موجود"
                  onClick={() => resetOneAndSync("inStock")}
                  error
                />
              )}
              {filtersFromUrl?.discounted && (
                <Badge
                  title="تخفیف‌دار"
                  onClick={() => resetOneAndSync("discounted")}
                  error
                />
              )}
              {TAXONOMY_FILTER_GROUPS.flatMap(({ key, type, label }) =>
                (filtersFromUrl[key] ? [filtersFromUrl[key]].flat() : []).map(
                  (slug) => (
                    <Badge
                      key={`${key}-${slug}`}
                      title={categoryBadgeTitle(categories, type, slug, label)}
                      onClick={() => removeValueAndSync(key, slug)}
                      error
                    />
                  ),
                ),
              )}
              {filtersFromUrl.concentrations.map((value) => (
                <Badge
                  key={`concentrations-${value}`}
                  title={concentrationLabel(value)}
                  onClick={() => removeValueAndSync("concentrations", value)}
                  error
                />
              ))}
            </section>
          </div>

          {/* Brands Filter section */}
          <BrandsFilter
            brands={brands}
            ref={brandsRef}
            state={state.draft?.brandIds}
            toggleBrandAndSync={toggleBrandAndSync}
            brandsLoading={brandsLoading}
          />

          {/* Bread Crumbs */}
          <section className="max-md:hidden pb-4">
            <BreadCrumbBase>
              <BreadCrumb href={"/"} label={"فروشگاه"} />
              <BreadCrumb
                href={"/products"}
                label={"محصولات"}
                chevron
                className="text-primary! font-bold"
              />
            </BreadCrumbBase>
          </section>
        </section>

        {/* Filters Modal */}
        <Modal isOpen={isModalOpen} onClose={CloseModal}>
          <form
            className="flex flex-col items-center justify-between gap-4 size-full"
            onSubmit={handleSubmit(HandleSubmitfilter)}
          >
            <FiltersModal
              isOpen={isModalOpen}
              mode={mode}
              setMode={setMode}
              onClose={CloseModal}
              addFilter={addFilter}
              resetFilter={resetFilter}
              control={control}
              watch={watch}
              errors={errors}
              filtersFromUrl={filtersFromUrl}
              resetAllFilters={resetAllFilters}
            />
          </form>
        </Modal>
      </div>
      <section className="w-full flex items-center justify-between py-6">
        {/* Products Genders Mode Info */}
        <div className=" flex items-center justify-center gap-2">
          <div className="bg-primary h-3 w-0.75 rounded-full"></div>
          <p className="text-xl font-bold text-stroke-800">
            {productListHeading(filtersFromUrl.gender, categories)}
          </p>
        </div>

        {/* Sort Button */}
        <div>
          <SortSection />
        </div>
      </section>
    </article>
  );
}

export default FilterSection;

function BrandsFilter({
  brands,
  ref,
  state,
  toggleBrandAndSync,
  brandsLoading,
}) {
  const selectedBrandIds = Array.isArray(state)
    ? state.map(Number).filter(Boolean)
    : [];
  return (
    <form className="relative max-md:hidden flex items-center justify-start gap-2 w-full h-12 lg:h-14 border border-primary/10 dark:border-stroke-200 bg-stroke-50 rounded-full size-full px-2 overflow-hidden">
      <div className="absolute right-0 z-10 flex items-center justify-center bg-stroke-0/10 backdrop-blur-md text-primary px-2 lg:text-lg font-bold h-full aspect-square">
        برندها
      </div>
      <div
        ref={ref}
        className="flex items-center justify-start gap-2 p-2 pr-14 pl-10 h-full max-w-full rounded-full overflow-x-auto scrollbar-none snap-x"
      >
        {brandsLoading
          ? Array.from({ length: 14 }).map((_, index) => (
              <Skeleton
                key={index}
                className="flex-none h-1/2 w-24 rounded-full bg-stroke-300"
              />
            ))
          : brands?.map((brand) => {
              const isChecked = selectedBrandIds.includes(Number(brand.id));
              return (
                <FilterCheckBox
                  key={brand.id}
                  checkId={brand.id}
                  imageSrc={brand.iconUrl}
                  name={"brandFilter"}
                  onChange={() => toggleBrandAndSync(brand.id)}
                  checked={isChecked}
                  className={`flex items-center justify-center text-nowrap size-full snap-center
                    ${isChecked && "dark:*:bg-stroke-0 *:border-2 dark:*:border-[1.5px] *:bg-white *:border-primary dark:*:border-stroke-200"}`}
                  imageClassName="px-2 h-full rounded-full duration-200 dark:*:invert "
                  ratio="aspect-3/2"
                />
              );
            })}
      </div>
      <button
        type="button"
        onClick={() => scrollTo(ref, "x", -400)}
        className="absolute left-0 z-10 flex items-center justify-center bg-stroke-0/10 backdrop-blur-md text-stroke-800 lg:text-lg font-bold h-full px-2"
      >
        <ChevronLeftIcon className="size-4 lg:size-5" />
      </button>
    </form>
  );
}
