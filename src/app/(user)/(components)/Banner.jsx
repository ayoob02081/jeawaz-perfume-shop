import BannerCard from "@/components/BannerCard";

function Banner() {
  return (
    <div className="flex items-center justify-center gap-4 mt-6 container mx-auto">
      <div className="flex gap-6 sm:gap-10 px-20 justify-evenly items-center w-full scrollbarX rounded-[0] sm:rounded-2xl xl:first:pr-[10%] 2xl:first:pr-[20%] xl:last:pl-[10%] 2xl:last:pl-[20%]">
        <div className="snap-center">
          <BannerCard />
        </div>
        <div className="snap-center">
          <BannerCard />
        </div>
        <div className="snap-center">
          <BannerCard />
        </div>
      </div>
    </div>
  );
}

export default Banner;
