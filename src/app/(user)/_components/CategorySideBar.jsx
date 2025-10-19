import { ArrowRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Modal from "@/components/Modal";
import Logo from "@/components/Logo";
import RadioButton from "@/ui/RadioButton";
import ImageFrame from "@/components/ImageFrame";

const volumes = [
  { id: "volume-5", label: "۵ میل" },
  { id: "volume-10", label: "۱۰ میل" },
  { id: "volume-20", label: "۲۰ میل" },
  { id: "volume-50", label: "۵۰ میل" },
  { id: "volume-75", label: "۷۵ میل" },
  { id: "volume-100", label: "۱۰۰ میل" },
];

const scents = [
  { id: "bitter-scent", label: "تلخ" },
  { id: "spicy-scent", label: "تند" },
  { id: "sweet-scent", label: "شیرین" },
  { id: "sour-scent", label: "ترش" },
];
const fragrances = [
  { id: "warm", label: "گرم" },
  { id: "cold", label: "سرد" },
  { id: "moderate", label: "معتدل" },
];
const priceRanges = [
  { id: "under-one-million", label: "زیر یک میلیون" },
  { id: "until-one-million", label: "تا یک میلیون" },
  { id: "until-five-million", label: "تا پنج میلیون" },
  { id: "over-five-million", label: "بالای پنج میلیون" },
];

const genderCategories = [
  { id: "both", src: "/images/perfume-1.svg", label: "عطر های مشترک" },
  { id: "women", src: "/images/perfume-2.svg", label: "عطر های زنانه" },
  { id: "men", src: "/images/perfume-3.svg", label: "عطر های مردانه" },
];

function CategorySideBar({ toggleCategory, categoryOpen, setCategoryOpen }) {
  return (
    <Modal
      toggleOpen={categoryOpen}
      onClose={() => setCategoryOpen(false)}
      category
    >
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
            <div className="flex md:flex-col items-center max-md:justify-evenly h-full">
              {genderCategories.map((gender) => (
                <CategoryRadioBtn
                  key={gender.id}
                  className=""
                  radioId={gender.id}
                  name="gender"
                  label={gender.label}
                  src={gender.src}
                  size="max-md:size-6 md:size-10"
                  chevron="block"
                />
              ))}
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
          <SideBarFilterCard fieldsetId="volume-value" title="حجم">
            {volumes.map((volume) => (
              <FilterRadioBtn
                key={volume.id}
                radioId={volume.id}
                name="volume"
                label={volume.label}
              />
            ))}
          </SideBarFilterCard>
          <SideBarFilterCard fieldsetId="scent-type" title="رایحه">
            {scents.map((scent) => (
              <FilterRadioBtn
                key={scent.id}
                radioId={scent.id}
                name="scent"
                label={scent.label}
              />
            ))}
          </SideBarFilterCard>
          <SideBarFilterCard fieldsetId="fragrance-type" title="طبع عطر">
            {fragrances.map((fragrance) => (
              <FilterRadioBtn
                key={fragrance.id}
                radioId={fragrance.id}
                name="fragrance"
                label={fragrance.label}
              />
            ))}
          </SideBarFilterCard>
          <SideBarFilterCard
            fieldsetId="price-range"
            title="محدوده قیمت"
            className="md:col-span-2"
          >
            {priceRanges.map((price) => (
              <FilterRadioBtn
                key={price.id}
                radioId={price.id}
                name="price"
                label={price.label}
              />
            ))}
          </SideBarFilterCard>
        </div>
      </form>
    </Modal>
  );
}

export default CategorySideBar;

function SideBarFilterCard({ title, fieldsetId, children, className }) {
  return (
    <div className={`flex flex-col items-start gap-5 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <ImageFrame
          src="/images/star-2-primery-icon.svg"
          alt="star icon"
          className="size-4"
        />
        <h5 className="text-text-primary">{title}</h5>
      </div>
      <fieldset id={fieldsetId} className="flex flex-col items-start gap-5">
        {children}
      </fieldset>
    </div>
  );
}
function SideBarCategoryCard({ fieldsetId, children }) {
  return (
    <fieldset id={fieldsetId} className="md:rounded-r-3xl md:overflow-hidden">
      <div className="md:h-[30rem] border-t border-[#E6EAF3] bg-grey max-md:h-[5.45rem]">
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
      //   onChange=""
      //   checked=""
    >
      <ImageFrame
        src={src}
        alt="perfume image"
        className={`felx items-center justify-center rounded-md bg-white ${size} duration-200 overflow-hidden`}
      />
    </RadioButton>
  );
}

function FilterRadioBtn({ radioId, name, label }) {
  return (
    <RadioButton
      className="flex flex-col items-start justify-start h-full text-xs text-text-secondary has-checked:text-primary duration-200 border-r-[2.5px] border-primary/10 has-checked:border-primary px-1 has-checked:font-bold leading-1.5"
      id={radioId}
      name={name}
      value={radioId}
      label={label}
      //   onChange=""
      //   checked=""
    />
  );
}
