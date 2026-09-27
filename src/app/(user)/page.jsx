import RecentProducts from "./_components/RecentProducts";
import CampaignsProducts from "./_components/CampaignsProducts";
import PopularProducts from "./_components/PopularProducts";
import GenderCategoriesLayout from "./_components/GenderCategoriesLayout";
import AccordCategoriesLayout from "./_components/AccordCategoriesLayout";
import PrimaryBannerLayout from "./_components/PrimaryBannerLayout";
import SecondaryBannerLayout from "./_components/SecondaryBannerLayout";

export default function Home() {
  return (
    <div className="relative flex flex-col justify-between gap-14 scrollbar--primary scrollbar-w-2 md:pb-10 max-sm:p-0">
      <img
        src="/images/flower.svg"
        alt="flower-icon"
        className="pointer-events-none absolute z-0 left-0 max-sm:top-60 max-lg:top-70 top-90 xl:top-120 max-sm:w-24 sm:w-26"
      />
      <img
        src="/images/flower.svg"
        alt="flower-icon"
        className="pointer-events-none absolute rotate-180 z-0 right-0 top-4/10 xl:top-3/7 max-sm:w-24 sm:w-26"
      />
      <img
        src="/images/flower.svg"
        alt="flower-icon"
        className="pointer-events-none absolute z-0 left-0 bottom-0 max-sm:w-24 sm:w-26"
      />
      <PrimaryBannerLayout />
      <GenderCategoriesLayout />
      <RecentProducts />
      <SecondaryBannerLayout />
      <CampaignsProducts />
      <AccordCategoriesLayout />
      <PopularProducts />
    </div>
  );
}
