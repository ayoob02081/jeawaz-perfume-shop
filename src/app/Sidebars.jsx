import { Suspense } from "react";
import CategorySidebar from "./(user)/_components/CategorySidebar";
import Sidebar from "@/components/SideBar";

function Sidebars() {
  return (
    <Suspense fallback={null}>
      <CategorySidebar />
      <Sidebar />
    </Suspense>
  );
}

export default Sidebars;
