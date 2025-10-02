import "../globals.css";
import OptionsFooter from "@/components/OptionsFooter";
import Providers from "../Providers";
import Header from "../Header";
import Footer from "../Footer";
import MobilePannel from "../MobilePannel";

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
