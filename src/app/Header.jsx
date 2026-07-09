import HeaderLayout from "@/components/HeaderLayout";

function Header() {
  return (
    <header className="container mx-auto xl:max-w-7xl p-px max-md:mb-40 md:mb-44">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
      <HeaderLayout />
    </header>
  );
}

export default Header;
