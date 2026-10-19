import Header from "./Header";
import Providers from "./Providers";
import Footer from "./Footer";
import MobilePannel from "./MobilePannel";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Sidebars from "./Sidebars";
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/seo.mjs";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// No openGraph here: Next would pass it unmerged to every page without its own.
export const metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SITE_NAME, template: `${SITE_NAME} | %s` },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children, modal }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable)}
    >
      <body
        dir="rtl"
        className="font-display antialiased scrollbar-none bg-stroke-0! print:bg-white! duration-200"
      >
        <Providers>
          <Toaster />
          {/* Site chrome is left out of printed pages (e.g. the order invoice). */}
          <div className="contents print:hidden">
            <Header />
            <Sidebars />
          </div>
          <main className="max-sm:min-h-[calc(100dvh-9.5rem)] sm:min-h-[calc(100dvh-5rem)] lg:min-h-[calc(100dvh-11rem)] print:min-h-0!">
            {modal}
            {children}
          </main>
          <div className="contents print:hidden">
            <Footer />
            <MobilePannel />
          </div>
        </Providers>
      </body>
    </html>
  );
}
