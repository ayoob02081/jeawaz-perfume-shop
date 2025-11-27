"use client";

import OptionsFooter from "@/components/OptionsFooter";
import Header from "./Header";
import Providers from "./Providers";
import Footer from "./Footer";
import MobilePannel from "./MobilePannel";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children, modal }) {
  return (
    <html lang="fa" dir="rtl">
      <body dir="rtl" className="font-display antialiased">
        <Providers>
          <Toaster />
          <Header />
          {modal}
          {children}
          <OptionsFooter />
          <Footer />
          <MobilePannel />
        </Providers>
      </body>
    </html>
  );
}
