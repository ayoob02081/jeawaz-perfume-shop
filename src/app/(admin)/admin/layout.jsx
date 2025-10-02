import "../../globals.css";
import Header from "@/app/Header";
import MobilePannel from "@/app/MobilePannel";
import Providers from "@/app/Providers";

export default function AdminLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased">
        <Providers>
          <Header />
          {children}
          <MobilePannel />
        </Providers>
      </body>
    </html>
  );
}
