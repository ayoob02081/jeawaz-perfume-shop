import BannerCardSecondary from "./BannerCardSecondary";

function SpecialProducts() {
  return (
    <div className="container mx-auto xl:max-w-7xl flex flex-row flex-wrap items-center justify-evenly gap-4 scrollbarX">
      <div className="snap-center">
        <BannerCardSecondary />
      </div>
      <div className="snap-center ">
        <BannerCardSecondary />
      </div>
    </div>
  );
}

export default SpecialProducts;
