import BannerCard from "@/components/BannerCard";

function Banner() {
  return (
    <div className="flex items-center justify-between gap-4 bg-green-100 h-72 mt-6">
      <div className="flex gap-6 justify-between items-center h-56 w-full px-7 snap-x snap-mandatory overflow-x-scroll">
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
