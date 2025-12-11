import Link from "next/link";
import ImageFrame from "./ImageFrame";

function SupportBox() {
  return (
    <div className="flex max-md:flex-col max-md:items-start md:items-center justify-between max-md:gap-8 bg-primary p-6 md:px-10 md:py-12 rounded-xl sm:rounded-2xl md:rounded-4xl w-full ">
      <p className="text-white font-bold md:text-xl lg:text-2xl">
        برای انتخاب بهترین عطر و مشاوره رایگان در کنارتان هستیم.
      </p>
      <Link
        href={"tel:+989180522273"}
        className="flex items-center gap-2 hover:*:first:bg-white/80 hover:*:last:text-white/80 "
      >
        <div className="flex items-center justify-center ring-4 ring-white/25 bg-white rounded-full size-6 md:size-8 lg:size-12 duration-200">
          <ImageFrame
            src="/images/headphone-1-primary-icon.svg"
            alt="map-marker-nearby"
            className="size-3 md:size-4 lg:size-6"
          />
        </div>
        <p className="text-sm md:text-base lg:text-lg text-white font-bold text-nowrap">
          دریافت مشاوره
        </p>
      </Link>
    </div>
  );
}

export default SupportBox;
