import ImageFrame from "./ImageFrame";

function SearchSection({ placeholder, onClick }) {
  return (
    <div className="flex items-center justify-center focus-within:border-[1.5px] lg:hover:*:left-12 lg:hover:*:*:last:w-auto lg:hover:*:last:*:last:block focus-within:*:last:*:last:w-auto focus-within:*:last:*:last:block focus-within:*:last:left-12 focus-within:*:last:bg-secondary-2 border-primary size-full h-12 rounded-[48px] bg-[#F7F7F7] focus-within:bg-white ">
      <input
        className="p-4 outline-0 w-full"
        type="search"
        placeholder={placeholder}
      />
      <button
        onClick={onClick}
        className={`absolute flex items-center justify-center gap-1 *:last:hidden *:last:w-0 left-6 top-1/2 -translate-1/2 bg-white rounded-full p-2 duration-200`}
      >
        <ImageFrame
          src="/images/search.svg"
          alt="search icon"
          className="size-6"
        />
        <p
          className={`max-lg:hidden lg:flex text-sm text-text-primary duration-200`}
        >
          جستجو
        </p>
      </button>
    </div>
  );
}

export default SearchSection;
