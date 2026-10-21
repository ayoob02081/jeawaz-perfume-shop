import { Suspense } from "react";
import HeaderLayout from "@/components/HeaderLayout";

function Header() {
  return (
    <header className="lg:container lg:mx-auto xl:max-w-7xl p-px max-sm:mb-22 sm:mb-20 lg:mb-44">
      <Suspense fallback={null}>
        <HeaderLayout />
      </Suspense>
    </header>
  );
}

export default Header;
