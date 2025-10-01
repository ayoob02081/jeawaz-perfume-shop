import "../globals.css";
import Header from "@/components/Header";
import MobilePannel from "@/components/MobilePannel";
import Footer from "@/components/Footer";
import OptionsFooter from "@/components/OptionsFooter";
import Providers from "../Providers";

export const metadata = {
  title: "Jeawaz",
  description: "perfume",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased scrollbar-none">
        <Providers>
          <Header />
          {children}
          <OptionsFooter />
          <Footer />
          <MobilePannel />
        </Providers>
      </body>
    </html>
  );
}
