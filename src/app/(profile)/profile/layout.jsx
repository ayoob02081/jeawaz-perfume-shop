import "../../globals.css";
import UserSidebar from "./_components/UserSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-lg:justify-center lg:justify-start container mx-auto max-w-7xl gap-8 max-lg:my-12 lg:my-5 max-lg:pt-4">
      <UserSidebar className="max-lg:hidden" />
      <div className="max-lg:hidden w-22" />
      {children}
    </div>
  );
}
