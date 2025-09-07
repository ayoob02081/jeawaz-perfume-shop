import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import SidebarFilterCard from "./SideBarFilterCard";
import FilterRadioBtn from "./FilterRadioBtn";
import SideBarCategoryCard from "./SideBarCategoryCard";
import CategoryRadioBtn from "./CategoryRadioBtn";
import Backdrop from "@/ui/Backdrop";
import Logo from "./Logo";

function CategorySideBar({ toggleCategory, categoryOpen }) {
  return (
    <Backdrop toggleOpen={categoryOpen}>
      <div className="flex items-center justify-between px-4 py-6 md:hidden md:h-0">
        <button className="size-6" onClick={toggleCategory}>
          <ArrowRightIcon className="size-5" />
        </button>
        <span className="text-text-primary font-bold">دسته بندی محصولات</span>
        <div className="size-5"></div>
      </div>
      <form className="flex max-md:flex-col md:items-stretch h-full">
        <SideBarCategoryCard
          className="md:hidden"
          fieldsetId="category-section"
        >
          <div className="flex flex-col items-center justify-between h-full md:p-4 md:pl-0">
            <div className="flex md:flex-col items-center max-md:justify-evenly">
              <CategoryRadioBtn
                className="p-2"
                radioId="both"
                name="gender"
                label="عطر های مشترک"
                imageSrc="/images/perfume1.png"
                size="max-md:size-6 md:size-10 "
                chevron="block"
              />
              <CategoryRadioBtn
                className=""
                radioId="women"
                name="gender"
                label="عطر های زنانه"
                imageSrc="/images/perfume1.png"
                size="max-md:size-6 md:size-10"
                chevron="block"
              />
              <CategoryRadioBtn
                className=""
                radioId="men"
                name="gender"
                label="عطر های مردانه"
                imageSrc="/images/perfume1.png"
                size="max-md:size-6 md:size-10"
                chevron="block"
              />
            </div>
            <Logo width="w-[5.75rem] h-12" className="md:p-2 max-md:hidden" />
          </div>
        </SideBarCategoryCard>
        <div className="md:hidden">
          <Link
            href={"/"}
            className="flex items-center justify-between p-6 text-primary "
          >
            <span>همه عطر های زنانه</span>
            <ChevronLeftIcon className="text-primary size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 md:gap-x-6 justify-items-start items-start py-8 px-6 border-t border-stroke">
          <SidebarFilterCard fieldsetId="volume-value" title="حجم">
            <FilterRadioBtn radioId="volume-5" name="volume" label="۵ میل" />
            <FilterRadioBtn radioId="volume-10" name="volume" label="۱۰ میل" />
            <FilterRadioBtn radioId="volume-20" name="volume" label="۲۰ میل" />
            <FilterRadioBtn radioId="volume-50" name="volume" label="۵۰ میل" />
            <FilterRadioBtn radioId="volume-75" name="volume" label="۷۵ میل" />
            <FilterRadioBtn
              radioId="volume-100"
              name="volume"
              label="۱۰۰ میل"
            />
          </SidebarFilterCard>
          <SidebarFilterCard fieldsetId="scent-type" title="رایحه">
            <FilterRadioBtn radioId="bitter-scent" name="scent" label="تلخ" />
            <FilterRadioBtn radioId="spicy-scent" name="scent" label="تند" />
            <FilterRadioBtn radioId="sweet-scent" name="scent" label="شیرین" />
            <FilterRadioBtn radioId="sour-scent" name="scent" label="ترش" />
          </SidebarFilterCard>
          <SidebarFilterCard fieldsetId="fragrance-type" title="طبع عطر">
            <FilterRadioBtn
              radioId="warm-fragrance"
              name="fragrance"
              label="گرم"
            />
            <FilterRadioBtn
              radioId="cold-fragrance"
              name="fragrance"
              label="سرد"
            />
            <FilterRadioBtn
              radioId="moderate-fragrance"
              name="fragrance"
              label="معتدل"
            />
          </SidebarFilterCard>
          <SidebarFilterCard
            fieldsetId="price-range"
            title="محدوده قیمت"
            className="md:col-span-2"
          >
            <FilterRadioBtn
              radioId="under-one-million"
              name="price"
              label="زیر یک میلیون"
            />
            <FilterRadioBtn
              radioId="until-one-million"
              name="price"
              label="تا یک میلیون"
            />
            <FilterRadioBtn
              radioId="until-five-million"
              name="price"
              label="تا پنج میلیون"
            />
            <FilterRadioBtn
              radioId="over-five-million"
              name="price"
              label="بالای پنج میلیون"
            />
          </SidebarFilterCard>
        </div>
      </form>
    </Backdrop>
  );
}

export default CategorySideBar;
