import ImageFrame from "@/components/ImageFrame";
import Badge from "@/ui/Badge";
import BrandFilter from "./BrandFilter";

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
      <div className="flex items-center justify-between w-full h-[4.5rem] border border-primary/10 bg-primary/5 rounded-[40px] px-6">
        <BrandFilter
          title="Calvin Klein (CK)"
          src="/images/ck-icon.svg"
          alt="ck icon"
        />
        <BrandFilter
          title="Yves Saint Laurent (YSL)"
          src="/images/Yves Saint Laurent (YSL)-icon.svg"
          alt="ysl icon"
        />
        <BrandFilter
          title="Chanel"
          src="/images/channel-icon.svg"
          alt="chanel icon"
        />
        <BrandFilter
          title="Calvin Klein (CK)"
          src="/images/ck-icon.svg"
          alt="ck icon"
        />
      </div>
      <div>3</div>
    </div>
  );
}

export default FilterSection;
