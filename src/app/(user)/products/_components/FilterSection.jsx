"use client";

import ImageFrame from "@/components/ImageFrame";
import Badge from "@/ui/Badge";
import BreadCrumbBase from "@/ui/BreadCrumbBase";
import BreadCrumb from "@/ui/BreadCrumb";
import CheckBox from "@/ui/CheckBox";
import { useGetAllBrandCategories } from "@/hooks/useCategories";
import { useRef, useState } from "react";
import Loading from "@/components/Loading";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

function FilterSection() {
  const brandsRef = useRef(null);
  const [brandsFilter, setBrandsFilter] = useState([]);
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
  // console.log(brandsFilter);

  return (
    <div className="border-b border-stroke">
      <div className="flex flex-col items-start justify-between size-full gap-6 py-4">
        <div className="w-full ">
          <div className="flex items-center justify-start gap-2 snap-x overflow-x-scroll scrollbar-none w-full">
            <button className="flex items-center justify-between gap-2 rounded-[40px] border-[1.5px] border-stroke max-md:min-w-[6.625rem] md:min-w-[8.315rem] max-md:h-8 md:h-11 snap-center px-4">
              <ImageFrame
                src="images/filter-icon.svg"
                alt="filter icon"
                className="size-5"
              />
              <p className="max-md:text-xs">فیلتر ها</p>
            </button>
            <Badge
              title="قیمت"
              // onClick={toggleFilter}
            />
            <Badge
              title="رایحه"
              // onClick={toggleFilter}
            />
            {brandsFilter.length > 0 && (
              <Badge title="برند" onClick={() => setBrandsFilter([])} />
            )}
            <Badge
              title="حجم"
              // onClick={toggleFilter}
            />
          </div>
        </div>
        {brandsLoading ? (
          <Loading />
        ) : (
          <BrandsFilter
            brandsFilter={brandsFilter}
            brands={brands}
            OnChange={OnChange}
            handeleScroll={handeleScroll}
            ref={brandsRef}
          />
        )}
        <div className="max-md:hidden pb-4">
          <BreadCrumbBase>
            <BreadCrumb href={"/"} label={"home"} />
            <BreadCrumb href={"/products"} label={"products"} chevron />
          </BreadCrumbBase>
        </div>
      </div>
    </div>
  );
}

export default FilterSection;

function BrandsFilter({ brandsFilter, brands, OnChange, handeleScroll, ref }) {
  return (
    <form className="relative max-md:hidden flex items-center w-full h-14 lg:h-16 border border-primary/10 bg-primary/5 rounded-[40px] overflow-hidden">
      <div className="absolute flex items-center justify-center top-1/2 -right-1 -translate-y-1/2 text-primary text-lg font-bold pr-4 pl-2 h-full z-10 backdrop-blur-lg shadow-xl shadow-white">
        برندها
      </div>
      <div
        ref={ref}
        className="flex items-center justify-between gap-2 pr-14 pl-8 size-full overflow-x-auto scrollbar-none snap-x scroll-smooth"
      >
        {brands?.map((brand) => {
          const isChecked = brandsFilter.includes(brand.brand);
          return (
            <FilterCheckbox
              key={brand.id}
              checkId={brand.brand}
              imageSrc={brand.iconUrl}
              name={"brandFilter"}
              onChange={OnChange}
              checked={isChecked}
            />
          );
        })}
      </div>
      <button
        onClick={handeleScroll}
        className="absolute flex items-center justify-center top-1/2 -left-1 -translate-y-1/2 text-primary pr-2 pl-4 h-full z-10 backdrop-blur-lg shadow-xl shadow-white"
      >
        <ChevronLeftIcon className="text-primary size-6" />
      </button>
    </form>
  );
}

function FilterCheckbox({
  checkId,
  name,
  label,
  className,
  imageSrc,
  checked,
  onChange,
}) {
  return (
    <CheckBox
      className={`${className} justify-center text-nowrap px-2 text-text-primary size-full md:py-2 has-checked:*:bg-white cursor-pointer has-checked:*:border-2  *:border-primary has-checked:text-primary snap-center duration-200`}
      id={checkId}
      name={name}
      value={checkId}
      label={label}
      onChange={onChange}
      checked={checked}
    >
      <div className="flex items-center justify-center px-3 py-1 lg:py-2 rounded-full size-full duration-200">
        <ImageFrame
          src={imageSrc}
          alt={`${checkId} icon`}
          className="min-w-20 h-full mix-blend-multiply"
        />
      </div>
    </CheckBox>
  );
}
