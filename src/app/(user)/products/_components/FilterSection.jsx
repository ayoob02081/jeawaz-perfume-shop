"use client";

import ImageFrame from "@/components/ImageFrame";
import { Badge } from "@/ui/Badge";
import BreadCrumbBase from "@/ui/BreadCrumbBase";
import BreadCrumb from "@/ui/BreadCrumb";
import { useGetAllBrandCategories } from "@/hooks/useCategories";
import { useRef, useState } from "react";
import Loading from "@/components/Loading";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Modal from "@/components/Modal";
import FormModalLayout from "@/components/FormModalLayout";
import FilterModes from "./FilterModes";
import { useFilters } from "@/hooks/useFilters";
import SortSection from "@/components/SortSection";
import FilterCheckBox from "@/ui/FilterCheckBox";

function FilterSection() {
  const { state, dispatch } = useFilters();

  const brandsRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandsFilter, setBrandsFilter] = useState([]);
  const [mode, setMode] = useState("all");

  const {
    data: brands,
    isLoading: brandsLoading,
    error,
  } = useGetAllBrandCategories();

  const handeleScroll = (e) => {
    e.preventDefault();
    if (!brandsRef.current) return;
    brandsRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  function OnChange(e) {
    const brandValue = e.target.value;

    if (!brandsFilter.includes(brandValue)) {
      setBrandsFilter([...brandsFilter, brandValue]);
    } else {
      const filteredBrands = brandsFilter.filter((e) => e !== brandValue);
      setBrandsFilter([...filteredBrands]);
    }
  }

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

  const HandlefilterData = () => {
    // e?.preventDefault();
    // setIsModalOpen(false);
  };

  function applyFilter() {
    submitFilters("APPLY_FILTERS");
    CloseModal();
  }

  function resetAllFilters() {
    setMode("all");
    submitFilters("RESET_ALL_APPLY");
  }

  // console.log(brandsFilter);

  return (
    <div>
      <div className="border-b border-stroke">
        <div className="flex flex-col items-start justify-between size-full gap-6 py-4">
          <div className="w-full ">
            <div className="flex items-center justify-start gap-2 snap-x overflow-x-scroll scrollbar-none w-full">
              <button
                onClick={ToggleModal}
                className="flex items-center justify-between gap-2 rounded-5xl border-[1.5px] border-stroke max-md:min-w-[6.625rem] md:min-w-[8.315rem] max-md:h-8 md:h-11 snap-center px-4"
              >
                <ImageFrame
                  src="images/filter-icon.svg"
                  alt="filter icon"
                  className="size-5"
                />
                <p className="max-md:text-xs">فیلتر ها</p>
              </button>
              {state.draft.priceRange[1] !== 300000000 && (
                <Badge
                  title="قیمت"
                  onClick={() => resetFilter("RESET_ONE", "priceRange")}
                  error
                />
              )}
              {state.draft.accords.length > 0 && (
                <Badge
                  title="رایحه"
                  onClick={() => resetFilter("RESET_ONE", "accords")}
                  error
                />
              )}
              {state.draft.brands.length > 0 && (
                <Badge
                  title="برند"
                  onClick={() => resetFilter("RESET_ONE", "brands")}
                  error
                />
              )}

              {state.draft.volumes.length > 0 && (
                <Badge
                  title="حجم"
                  onClick={() => resetFilter("RESET_ONE", "volumes")}
                  error
                />
              )}
              {state.draft.gender?.length > 0 && (
                <Badge
                  title="جنسیت"
                  onClick={() => resetFilter("RESET_ONE", "gender")}
                  error
                />
              )}
            </div>
          </div>
          {brandsLoading ? (
            <Loading />
          ) : (
            <BrandsFilter
              brands={brands}
              OnChange={OnChange}
              handeleScroll={handeleScroll}
              ref={brandsRef}
              state={state.draft?.brands}
              addFilter={addFilter}
              applyFilter={applyFilter}
            />
          )}
          <div className="max-md:hidden pb-4">
            <BreadCrumbBase>
              <BreadCrumb href={"/"} label={"home"} />
              <BreadCrumb href={"/products"} label={"products"} chevron />
            </BreadCrumbBase>
          </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={CloseModal}>
          <FormModalLayout
            handleSubmit={HandlefilterData}
            onClose={CloseModal}
            closeBtn={false}
          >
            <FilterModes
              mode={mode}
              setMode={setMode}
              onClose={CloseModal}
              addFilter={addFilter}
              applyFilter={applyFilter}
              resetAllFilters={resetAllFilters}
              resetFilter={resetFilter}
            />
          </FormModalLayout>
        </Modal>
      </div>
      <div className="w-full flex items-center justify-between py-6">
        <div className=" flex items-center justify-center gap-2">
          <div className="bg-primary h-3 w-[3px] rounded-full"></div>
          <p className="text-xl font-bold">عطر های مردانه</p>
        </div>
        <div>
          <SortSection />
        </div>
      </div>
    </div>
  );
}

export default FilterSection;

function BrandsFilter({
  brands,
  handeleScroll,
  ref,
  state,
  addFilter,
  applyFilter,
}) {
  return (
    <form className="relative max-md:hidden flex items-center gap-2 w-full h-14 lg:h-[72px] overflow-hidden">
      <div className=" flex items-center justify-center border border-primary/10 bg-secondary-2 rounded-full text-primary lg:text-lg font-bold h-full aspect-square">
        برندها
      </div>
      <div className="flex items-center justify-center border border-primary/10 bg-secondary-2 rounded-full size-full overflow-hidden px-2">
        <div
          ref={ref}
          className="flex items-center justify-between gap-2 p-2 size-full rounded-full overflow-x-auto scrollbar-none snap-x scroll-smooth"
        >
          {brands?.map((brand) => {
            const isChecked = state.includes(brand.value);

            return (
              <FilterCheckBox
                key={brand.id}
                checkId={brand.value}
                imageSrc={brand.iconUrl}
                name={"brandFilter"}
                onChange={() => addFilter("SET_ITEMS", "brands", brand.value)}
                checked={isChecked}
                className="justify-center text-nowrap text-text-primary has-checked:*:border-2 has-checked:text-primary has-checked:*:border-primary has-checked:*:bg-white size-full snap-center"
                imageClassName="p-2 lg h-10 lg:h-12 w-32 rounded-full duration-200"
              />
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={state.length > 0 ? applyFilter : null}
        disabled={state.length > 0 ? false : true}
        className="flex items-center justify-center border-2 rounded-full h-full aspect-square border-primary bg-white  disabled:border-secondary disabled:*:text-text-secondary/20 duration-200"
      >
        <ChevronLeftIcon className="md:size-6 lg:size-8 text-primary duration-200" />
      </button>
    </form>
  );
}
