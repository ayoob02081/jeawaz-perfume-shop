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
  // Latched: once the user signals they may open the category panel, its
  // filter data loads and stays enabled.
  const [categoryIntent, setCategoryIntent] = useState(false);

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

  const warmCategory = useCallback(() => {
    setCategoryIntent(true);
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
      categoryIntent,
      warmCategory,
    }),
    [
      isSidebarOpen,
      isCategoryOpen,
      categoryIntent,
      openSidebar,
      closeSidebar,
      closeCategory,
      toggleSidebar,
      toggleCategory,
      warmCategory,
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
