import Banner from "./_components/Banner";
import RecentsPrducts from "./_components/RecentPrducts";
import Categories from "./_components/Categories";
import FilteredProducts from "./_components/FilteredProducts";
import OffProducts from "./_components/OffProducts";
import PopularProducts from "./_components/PopularProducts";
import SpecialProducts from "./_components/SpecialProducts";

export default function Home() {
  return (
    <div className="flex flex-col justify-between gap-14 ">
      <Banner />
      <Categories />
      <RecentsPrducts />
      <SpecialProducts />
      <OffProducts />
      <FilteredProducts />
      <PopularProducts />
    </div>
  );
}
