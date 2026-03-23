import RecentProducts from "./_components/RecentProducts";
import OffProducts from "./_components/OffProducts";
import PopularProducts from "./_components/PopularProducts";
import GenderCategoriesLayout from "./_components/GenderCategoriesLayout";
import AccordCategoriesLayout from "./_components/AccordCategoriesLayout";
import PrimaryBannerLayout from "./_components/PrimaryBannerLayout";
import SecondaryBannerLayout from "./_components/SecondaryBannerLayout";

export default function Home() {
  return (
    <div className="flex flex-col justify-between gap-14 mt-40 md:mt-32 scrollbar--primary scrollbar-w-2 md:pb-10">
      <PrimaryBannerLayout />
      <GenderCategoriesLayout />
      <RecentProducts />
      <SecondaryBannerLayout />
      <OffProducts />
      <AccordCategoriesLayout />
      <PopularProducts />
    </div>
  );
}
