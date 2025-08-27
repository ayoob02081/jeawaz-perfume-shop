import BannerCard from "@/components/BannerCard";

function Banner() {
  return (
    <div className="flex items-center justify-center gap-4 mt-6 container mx-auto xl:max-w-7xl">
      <div className="flex gap-6 sm:gap-10 py-6 px-20 justify-evenly items-center w-full scrollbarX">
        <div className="snap-center pb-2">
          <BannerCard />
        </div>
        <div className="snap-center pb-2">
          <BannerCard />
        </div>
        <div className="snap-center pb-2">
          <BannerCard />
        </div>
      </div>
    </div>
  );
}

export default Banner;
