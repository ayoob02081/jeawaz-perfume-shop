import "../../globals.css";
import UserSidebar from "./_components/UserSidebar";

export const metadata = {
  title: "Jeawaz",
  description: "Profile",
};

export default function RootLayout({ children }) {
  return (
    <div className="flex items-start max-md:justify-center md:justify-start container mx-auto max-w-7xl gap-8 max-md:my-12 md:my-5 px-4">
      <UserSidebar />
      {children}
    </div>
  );
}
