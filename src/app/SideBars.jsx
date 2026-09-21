"use client";

import { Suspense } from "react";
import { useSidebar } from "@/contexts/Sidebars/SidebarContext";
import CategorySidebar from "./(user)/_components/CategorySidebar";
import Sidebar from "@/components/SideBar";

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
      <Suspense fallback={null}>
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
      </Suspense>
    </>
  );
}

export default SideBars;
