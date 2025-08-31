import MobileHeader from "@/components/MobileHeader";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "./(components)/Footer";
import MobilePannel from "@/components/MobilePannel";
import MobileMenu from "@/components/MobileMenu";

export const metadata = {
  title: "Jeawaz",
  description: "perfume",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased">
        <MobileMenu />
        <MobileHeader />
        <Header />
        {children}
        <Footer />
        <MobilePannel />
      </body>
    </html>
  );
}
