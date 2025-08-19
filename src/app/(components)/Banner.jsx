import BannerCard from "@/components/BannerCard";

function Banner() {
  return (
    <div className="relative flex items-center justify-between gap-4 bg-green-100 h-72 mt-6">
      <div className="flex gap-6 justify-between items-center h-56 w-full px-7 snap-x snap-mandatory overflow-x-scroll scrollbar-none">
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
