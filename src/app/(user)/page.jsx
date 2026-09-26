import RecentProducts from "./_components/RecentProducts";
import CampaignsProducts from "./_components/CampaignsProducts";
import PopularProducts from "./_components/PopularProducts";
import GenderCategoriesLayout from "./_components/GenderCategoriesLayout";
import AccordCategoriesLayout from "./_components/AccordCategoriesLayout";
import PrimaryBannerLayout from "./_components/PrimaryBannerLayout";
import SecondaryBannerLayout from "./_components/SecondaryBannerLayout";

export default function Home() {
  return (
    <div className="flex flex-col justify-between gap-14 scrollbar--primary scrollbar-w-2 md:pb-10 max-sm:p-0">
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
