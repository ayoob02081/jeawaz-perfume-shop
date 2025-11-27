import "../globals.css";
import OptionsFooter from "@/components/OptionsFooter";
import Providers from "../Providers";
import Header from "../Header";
import Footer from "../Footer";
import MobilePannel from "../MobilePannel";
import BannerLayout from "./_components/BannerLayout";
import CategoriesLayout from "./_components/CategoriesLayout";
import RecentProducts from "./_components/RecentProducts";
import BannerSecondaryLayout from "./_components/BannerSecondaryLayout";
import OffProducts from "./_components/OffProducts";
import FilteredProductsLayout from "./_components/FilteredProductsLayout";
import PopularProducts from "./_components/PopularProducts";

export const metadata = {
  title: "Jeawaz",
  description: "perfume",
};

export default function RootLayout({ children }) {
  return <>{children}</>;
}
