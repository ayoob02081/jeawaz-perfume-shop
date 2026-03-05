"use client";

import Header from "./Header";
import Providers from "./Providers";
import Footer from "./Footer";
import MobilePannel from "./MobilePannel";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children, modal }) {
  return (
    <html lang="fa" dir="rtl">
      <body dir="rtl" className="font-display antialiased scrollbar-none">
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
