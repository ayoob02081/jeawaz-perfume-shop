import OptionsFooter from "@/components/OptionsFooter";
import Banner from "./(components)/Banner";
import RecentsPrducts from "./(components)/RecentPrducts";
import Categories from "./(components)/Categories";
import FilteredProducts from "./(components)/FilteredProducts";
import OffProducts from "./(components)/OffProducts";
import PopularProducts from "./(components)/PopularProducts";
import SpecialProducts from "./(components)/SpecialProducts";

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
      <OptionsFooter />
    </div>
  );
}
