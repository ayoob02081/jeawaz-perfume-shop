import BannerCard from "@/components/BannerCard";

function Banner() {
  return (
    <div className="relative flex items-center justify-between gap-4 bg-green-100 mt-6">
      <div className="flex gap-6 sm:gap-16 justify-between items-center w-full p-7 sm:px-16 snap-x snap-mandatory overflow-x-scroll scrollbar-none">
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
