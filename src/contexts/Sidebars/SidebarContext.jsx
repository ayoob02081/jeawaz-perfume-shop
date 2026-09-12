"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Category
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // -------------------------
  // Sidebar
  // -------------------------

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // -------------------------
  // Category
  // -------------------------

  const toggleCategory = useCallback(() => {
    setIsCategoryOpen((prevState) => !prevState);
  }, []);

  const closeCategory = useCallback(() => {
    setIsCategoryOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      // Sidebar
      isSidebarOpen,
      setIsSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,

      // Category
      isCategoryOpen,
      setIsCategoryOpen,
      closeCategory,
      toggleCategory,
    }),
    [
      isSidebarOpen,
      isCategoryOpen,
      openSidebar,
      closeSidebar,
      closeCategory,
      toggleSidebar,
      toggleCategory,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (context === null) {
    throw new Error("useSidebar must be used inside SidebarProvider");
  }

  return context;
}
