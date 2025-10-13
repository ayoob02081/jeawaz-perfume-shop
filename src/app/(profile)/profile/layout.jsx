import "../../globals.css";

import OptionsFooter from "@/components/OptionsFooter";
import Providers from "../../Providers";
import Header from "@/app/Header";
import Footer from "@/app/Footer";
import MobilePannel from "@/app/MobilePannel";
import ProfileLayout from "./_components/ProfileLayout";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased">
        <Providers>
          <Header />
          <div className="flex items-start justify-center container mx-auto gap-4 my-12">
            <ProfileLayout />
            {children}
          </div>
          <OptionsFooter />
          <Footer />
          <MobilePannel />
        </Providers>
      </body>
    </html>
  );
}
