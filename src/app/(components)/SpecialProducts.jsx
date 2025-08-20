import BannerCardSecondary from "@/components/BannerCardSecondary";

function SpecialProducts() {
  return (
    <div className="container mx-auto xl:max-w-7xl flex flex-col items-center justify-between gap-4 h-80 bg-yello-100">
      <div>
        <BannerCardSecondary />
      </div>
      <div>
        <BannerCardSecondary />
      </div>
    </div>
  );
}

export default SpecialProducts;
