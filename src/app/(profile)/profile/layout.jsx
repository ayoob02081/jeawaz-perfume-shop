import "../../globals.css";

import OptionsFooter from "@/components/OptionsFooter";
import Providers from "../../Providers";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import MobilePannel from "@/app/MobilePannel";
import UserSidebar from "./_components/UserSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-md:justify-center md:justify-start container mx-auto max-w-7xl gap-4 my-12 px-4">
      <UserSidebar />
      {children}
    </div>
  );
}
