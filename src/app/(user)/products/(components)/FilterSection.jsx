import ImageFrame from "@/components/ImageFrame";
import Badge from "@/ui/Badge";
import FilterCheckbox from "@/components/FilterCheckbox";
import BreadCrumbBase from "@/ui/BreadCrumbBase";
import BreadCrumb from "@/ui/BreadCrumb";

function FilterSection() {
  return (
    <div className="flex flex-col items-start justify-between h-full py-4">
      <div className="flex items-center justify-between gap-4">
        <button className="flex items-center justify-center gap-2 btn btn-secondary w-[8.315rem] h-11">
          <ImageFrame
            src="images/filter-icon.svg"
            alt="filter icon"
            className="size-5"
          />
          <p>فیلتر ها</p>
        </button>
        <div className="flex items-center justify-center gap-2">
          <Badge
            title="قیمت"
            // onClick={toggleFilter}
          />
          <Badge
            title="رایحه"
            // onClick={toggleFilter}
          />
        </div>
      </div>
      <form className="max-md:hidden w-full ">
        <div className="flex items-center justify-between gap-4 w-full h-[4.5rem] border border-primary/10 bg-primary/5 rounded-[40px] px-6 overflow-auto scrollbar-none">
          <FilterCheckbox
            checkId={"Calvin Klein (CK)"}
            imageSrc={"/images/ck-icon.svg"}
            label={"Calvin Klein (CK)"}
            name={"brandFilter"}
            className={""}
          />
          <FilterCheckbox
            checkId={"Yves Saint Laurent (YSL)"}
            imageSrc={"/images/Yves Saint Laurent (YSL)-icon.svg"}
            label={"Yves Saint Laurent (YSL)"}
            name={"brandFilter"}
            className={""}
          />
          <FilterCheckbox
            checkId={"Chanel"}
            imageSrc={"/images/channel-icon.svg"}
            label={"Chanel"}
            name={"brandFilter"}
            className={""}
          />
          <FilterCheckbox
            checkId={"Calvin Klein (CK)2"}
            imageSrc={"/images/ck-icon.svg"}
            label={"Calvin Klein (CK)2"}
            name={"brandFilter"}
            className={""}
          />
        </div>
      </form>
      <div className="max-md:hidden">
        <BreadCrumbBase>
          <BreadCrumb href={"/"} label={"home"} />
          <BreadCrumb href={"/products"} label={"products"} chevron />
        </BreadCrumbBase>
      </div>
    </div>
  );
}

export default FilterSection;
