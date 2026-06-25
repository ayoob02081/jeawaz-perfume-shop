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
import Loading from "@/components/Loading";
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
import { useForm } from "react-hook-form";

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
  const isGenderFilter = filtersFromUrl?.gender;
  const currentGenderData =
    isGenderFilter &&
    categories.find((category) => category.value === isGenderFilter);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      minPrice: filtersFromUrl?.priceRange[0] || null,
      maxPrice: filtersFromUrl?.priceRange[1] || null,
    },
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
    setIsModalOpen((prev) => !prev);
  };

  const CloseModal = () => {
    setIsModalOpen(false);
    setMode("all");
  };

  const HandleSubmitfilter = () => {
    applyFilter();
    setIsModalOpen(false);
  };

  function applyFilter() {
    const query = buildQueryFromFilters(state.draft, searchParams);

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    dispatch({ type: "APPLY_FILTERS" });
    CloseModal();
  }

  function resetAllFilters() {
    setMode("all");

    reset({
      minPrice: null,
      maxPrice: null,
    });

    router.replace(pathname, { scroll: false });

    dispatch({ type: "RESET_ALL_APPLY" });
  }

  function resetOneAndSync(key) {
    const newDraft = {
      ...state.draft,
      [key]: emptyFilters[key],
    };

    const query = buildQueryFromFilters(newDraft, searchParams);

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    dispatch({ type: "RESET_ONE", key });
  }

  useEffect(() => {
    dispatch({
      type: "HYDRATE_FROM_URL",
      payload: filtersFromUrl,
    });

    reset({
      minPrice: filtersFromUrl?.priceRange[0] || null,
      maxPrice: filtersFromUrl?.priceRange[1] || null,
    });
  }, [search, dispatch, reset]);

  return (
    <article>
      <div className="border-b border-stroke-200">
        <section className="flex flex-col items-start justify-between size-full gap-6 py-4">
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
              {filtersFromUrl?.accords.length > 0 && (
                <Badge
                  title="رایحه"
                  onClick={() => resetOneAndSync("accords")}
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
              {filtersFromUrl?.gender && (
                <Badge
                  title="جنسیت"
                  onClick={() => resetOneAndSync("gender")}
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
            </section>
          </div>
          {/* Brands Filter section */}
          {brandsLoading ? (
            <Loading />
          ) : (
            <BrandsFilter
              brands={brands}
              ref={brandsRef}
              state={state.draft?.brandIds}
              addFilter={addFilter}
              resetOneAndSync={resetOneAndSync}
              applyFilter={applyFilter}
            />
          )}

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
              mode={mode}
              setMode={setMode}
              onClose={CloseModal}
              addFilter={addFilter}
              control={control}
              watch={watch}
              resetAllFilters={resetAllFilters}
              resetFilter={resetFilter}
            />
          </form>
        </Modal>
      </div>
      <section className="w-full flex items-center justify-between py-6">
        {/* Products Genders Mode Info */}
        <div className=" flex items-center justify-center gap-2">
          <div className="bg-primary h-3 w-0.75 rounded-full"></div>
          <p className="text-xl font-bold text-stroke-800">
            {isGenderFilter
              ? " ادکلن‌های" + currentGenderData?.title
              : "همه ادکلن‌ها"}
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
  addFilter,
  applyFilter,
  resetOneAndSync,
}) {
  const selectedBrandIds = Array.isArray(state)
    ? state.map(Number).filter(Boolean)
    : [];
  return (
    <form className="relative max-md:hidden flex items-center gap-2 w-full h-14 lg:h-18 overflow-hidden">
      <div className=" flex items-center justify-center border border-primary/10 dark:border-stroke-200 bg-stroke-50 rounded-full text-primary dark:text-stroke-800 lg:text-lg font-bold h-full aspect-square">
        برندها
      </div>
      <div className="flex items-center justify-center border border-primary/10 dark:border-stroke-200 bg-stroke-50 rounded-full size-full overflow-hidden px-2">
        <div
          ref={ref}
          className="flex items-center justify-between gap-2 p-2 size-full rounded-full overflow-x-auto scrollbar-none snap-x scroll-smooth"
        >
          {brands?.map((brand) => {
            const isChecked = selectedBrandIds.includes(Number(brand.id));

            return (
              <FilterCheckBox
                key={brand.id}
                checkId={brand.id}
                imageSrc={brand.iconUrl}
                name={"brandFilter"}
                onChange={() =>
                  selectedBrandIds?.length === 1 &&
                  selectedBrandIds?.includes(brand.id)
                    ? resetOneAndSync("brandIds")
                    : addFilter("SET_ITEMS", "brandIds", Number(brand.id))
                }
                checked={isChecked}
                className={`justify-center text-nowrap has-checked:*:border-2 dark:has-checked:*:border-[1.5px] has-checked:*:bg-white  dark:has-checked:*:bg-stroke-0  *:border-primary dark:*:border-stroke-200 has-checked:*:border-primary dark:has-checked:*:border-stroke-200 size-full snap-center`}
                imageClassName="p-2 lg h-10 lg:h-12 w-32 rounded-full duration-200 dark:*:invert "
              />
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={applyFilter}
        disabled={selectedBrandIds?.length === 0}
        className="flex items-center justify-center border-2 rounded-full h-full aspect-square border-primary dark:border-stroke-200 bg-stroke-0 disabled:border-stroke-150 dark:disabled:border-stroke-50 disabled:*:text-stroke-600/20 duration-200"
      >
        <ChevronLeftIcon className="md:size-6 lg:size-8 text-primary dark:text-stroke-200 duration-200" />
      </button>
    </form>
  );
}
