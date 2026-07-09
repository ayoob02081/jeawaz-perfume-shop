import "../../globals.css";
import AdminSidebar from "./_components/AdminSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-md:justify-center md:justify-start w-full container mx-auto max-w-7xl gap-6 max-md:my-12 md:my-5 px-4">
      <AdminSidebar />
      {children}
    </div>
  );
}
