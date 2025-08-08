import Header from "@/components/Header";
import "./globals.css";

export const metadata = {
  title: "Jeawaz",
  description: "perfume",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-display antialiased">
        <Header />
        <div className=" xl:max-w-7xl">{children}</div>
      </body>
    </html>
  );
}
