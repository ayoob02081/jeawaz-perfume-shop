import { Suspense } from "react";
import HeaderLayout from "@/components/HeaderLayout";

function Header() {
  return (
    <header className="container mx-auto xl:max-w-7xl p-px max-sm:mb-38 sm:mb-20 lg:mb-44">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
      <Suspense fallback={null}>
        <HeaderLayout />
      </Suspense>
    </header>
  );
}

export default Header;
