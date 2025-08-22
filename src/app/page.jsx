import Banner from "@/app/(components)/Banner";
import Categories from "@/app/(components)/Categories";
import RecentsPrducts from "./(components)/RecentPrducts";
import SpecialProducts from "./(components)/SpecialProducts";
import OffProducts from "./(components)/OffProducts";
import FilteredProducts from "./(components)/FilteredProducts";
import PopularProducts from "./(components)/PopularProducts";
import OptionsFooter from "@/components/OptionsFooter";
import Footer from "./(components)/Footer";

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
