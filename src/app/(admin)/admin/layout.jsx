import "../../globals.css";
import AdminSidebar from "./_components/AdminSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-lg:justify-center lg:justify-start w-full container mx-auto max-w-7xl gap-6 lg:pb-5 max-lg:pb-10 overflow-hidden">
      <AdminSidebar className="max-lg:hidden" />
      <div className="max-lg:hidden w-22" />
      {children}
    </div>
  );
}
