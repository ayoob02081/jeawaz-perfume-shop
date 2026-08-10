import Header from "./Header";
import Providers from "./Providers";
import Footer from "./Footer";
import MobilePannel from "./MobilePannel";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  metadataBase: new URL("https://jeawaz.ir"),
  title: { default: "جیاواز پرفیوم", template: "جیاواز پرفیوم | %s" },
  description:
    "خرید آنلاین ادکلن و دکانت با بهترین قیمت و ارسال به سراسر ایران",
};

export default function RootLayout({ children, modal }) {
  return (
    <html lang="fa" dir="rtl" className={cn("font-sans", inter.variable)}>
      <body
        dir="rtl"
        className="font-display antialiased scrollbar-none bg-stroke-0! duration-200"
      >
        <Providers>
          <Toaster />
          <Header />
          <main>
            {modal}
            {children}
          </main>
          <Footer />
          <MobilePannel />
        </Providers>
      </body>
    </html>
  );
}
