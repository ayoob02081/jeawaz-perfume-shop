import "../../globals.css";
import UserSidebar from "./_components/UserSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-lg:justify-center lg:justify-start container mx-auto max-w-7xl gap-4 max-sm:mb-5 sm:my-5 max-sm:p-0 max-lg:pt-2 print:block print:max-w-none print:m-0 print:p-0">
      <UserSidebar className="max-lg:hidden print:hidden" />
      <div className="max-lg:hidden w-22 2xl:hidden print:hidden" />
      {children}
    </div>
  );
}
