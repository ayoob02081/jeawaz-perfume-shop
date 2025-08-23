import MobileHeader from "@/components/MobileHeader";
import "./globals.css";
import MobilePannel from "@/components/MobilePannel";
import Footer from "./(components)/Footer";
import Header from "@/components/Header";

export const metadata = {
  title: "Jeawaz",
  description: "perfume",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased">
        <MobileHeader />
        <Header />
        {children}
        <Footer />
        <MobilePannel />
      </body>
    </html>
  );
}
