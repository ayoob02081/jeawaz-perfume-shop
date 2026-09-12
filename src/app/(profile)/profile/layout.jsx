import "../../globals.css";
import UserSidebar from "./_components/UserSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-lg:justify-center lg:justify-start container mx-auto max-w-7xl gap-8 max-sm:mb-5 sm:my-5 max-sm:p-0 max-lg:pt-2">
      <UserSidebar className="max-lg:hidden" />
      <div className="max-lg:hidden w-22" />
      {children}
    </div>
  );
}
