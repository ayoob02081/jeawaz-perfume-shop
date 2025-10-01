import HeaderLayout from "./HeaderLayout";

function Header() {
  return (
    <header className="container mx-auto xl:max-w-7xl p-2 md:border-b-[1.5px] border-stroke md:pb-5">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
      <HeaderLayout />
    </header>
  );
}

export default Header;
