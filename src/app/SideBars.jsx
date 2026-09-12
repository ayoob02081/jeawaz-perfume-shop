"use client";

import { useSidebar } from "@/contexts/Sidebars/SidebarContext";
import CategorySidebar from "./(user)/_components/CategorySidebar";
import Sidebar from "@/components/Sidebar";

function SideBars() {
  const {
    isSidebarOpen,
    isCategoryOpen,
    closeCategory,
    toggleSidebar,
    toggleCategory,
  } = useSidebar();

  return (
    <>
      <CategorySidebar
        toggleCategory={toggleCategory}
        isCategoryOpen={isCategoryOpen}
        closeCategory={closeCategory}
      />
      <Sidebar
        toggleSidebar={toggleSidebar}
        toggleCategory={toggleCategory}
        isSidebarOpen={isSidebarOpen}
      />
    </>
  );
}

export default SideBars;
