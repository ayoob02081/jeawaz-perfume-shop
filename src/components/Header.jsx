import Link from "next/link";

function Header() {
  return (
    <header className="bg-red-100 fixed top-0 right-0 left-0 p-2 h-32">
      <nav>
        <ul className="grid grid-cols-3 p-2 gap-x-10 gap-y-5 container mx-auto xl:max-w-7xl">
          <li className=" justify-items-center">
            <Link className="block p-2" href="/">
              options
            </Link>
          </li>
          <li className=" justify-items-center">
            <Link className="block p-2" href="/">
              jeawaz
            </Link>
          </li>
          <li className=" justify-items-center">
            <Link className="block p-2" href="/">
              card
            </Link>
          </li>
          <li className="grow col-span-3">
            <input type="search" placeholder="search" />
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
