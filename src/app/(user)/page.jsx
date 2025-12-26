import BannerLayout from "./_components/BannerLayout";
import RecentProducts from "./_components/RecentProducts";
import CategoriesLayout from "./_components/CategoriesLayout";
import FilteredProductsLayout from "./_components/FilteredProductsLayout";
import OffProducts from "./_components/OffProducts";
import PopularProducts from "./_components/PopularProducts";
import BannerSecondaryLayout from "./_components/BannerSecondaryLayout";

export default function Home() {
  return (
    <div className="flex flex-col justify-between gap-14 mt-40 md:mt-32">
      <BannerLayout />
      <CategoriesLayout />
      <RecentProducts />
      <BannerSecondaryLayout />
      <OffProducts />
      <FilteredProductsLayout />
      <PopularProducts />
    </div>
  );
}
