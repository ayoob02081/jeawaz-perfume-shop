import Header from "@/components/Header";
import "./globals.css";
import MobilePannel from "@/components/MobilePannel";
import Footer from "./(components)/Footer";

export const metadata = {
  title: "Jeawaz",
  description: "perfume",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased">
        <Header />
        {children}
        <Footer />
        <MobilePannel />
      </body>
    </html>
  );
}
