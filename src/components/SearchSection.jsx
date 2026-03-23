import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

function SearchSection({ placeholder, onClick }) {
  return (
    <div className="flex items-center justify-center focus-within:border-[1.5px] lg:hover:*:left-12 lg:hover:*:*:last:w-auto lg:hover:*:last:*:last:block focus-within:*:last:*:last:w-auto focus-within:*:last:*:last:block focus-within:*:last:left-12 focus-within:*:last:bg-stroke-100 border-primary size-full h-12 rounded-[48px] bg-stroke-100 focus-within:bg-stroke-0 duration-200">
      <input
        className="p-4 outline-0 w-full text-stroke-800"
        type="search"
        placeholder={placeholder}
      />
      <button
        onClick={onClick}
        className={`absolute flex items-center justify-center gap-1 *:last:hidden *:last:w-0 left-6 top-1/2 -translate-1/2 bg-stroke-0 rounded-full p-2 duration-200`}
      >
        <MagnifyingGlassIcon className="size-6 text-stroke-800 duration-200" />
        <p
          className={`max-lg:hidden lg:flex text-sm text-stroke-800 duration-200`}
        >
          جستجو
        </p>
      </button>
    </div>
  );
}

export default SearchSection;
