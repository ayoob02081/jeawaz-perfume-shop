"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import AppImage from "./AppImage";
import { useGetProductSuggestions } from "@/hooks/useProducts";

function SearchSection({ placeholder, value, onChange, onSubmit }) {
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebounce(value, 350);

  const shouldShow = debouncedSearch?.trim()?.length >= 3;

  const { data, isFetching } = useGetProductSuggestions({
    search: debouncedSearch,
    limit: 5,
  });

  const results = data || [];
  return (
    <>
      <form
        onSubmit={onSubmit}
        className={`flex items-center justify-center group border-primary size-full h-12 rounded-[48px] 
          ${open && shouldShow ? "bg-stroke-0 border-[1.5px]" : "bg-stroke-100 focus-within:border-[1.5px] focus-within:bg-stroke-0"}
           duration-200`}
      >
        <input
          className="p-4 outline-0 w-full text-stroke-800"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
        <button
          type="submit"
          className={`absolute flex items-center justify-center gap-1 top-1/2 -translate-1/2 bg-stroke-0 rounded-full p-2 ${open && shouldShow ? "left-12 bg-stroke-100" : "lg:group-hover:left-12 lg:group-focus-within:left-12 group-focus-within:bg-stroke-100 left-6"}  duration-200`}
        >
          <MagnifyingGlassIcon className="size-6 text-stroke-800 duration-200" />
          <p
            className={` text-sm text-stroke-800 ${open && shouldShow ? "block w-full" : "lg:group-hover:w-auto lg:group-focus-within:w-auto lg:group-hover:block lg:group-focus-within:block hidden w-0"} duration-200`}
          >
            جستجو
          </p>
        </button>
      </form>
      {open && shouldShow && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-stroke-0 rounded-2xl shadow-xl shadow-stroke-800/10 border border-stroke-150 z-50 overflow-hidden">
          {isFetching && (
            <div className="p-4 text-sm text-gray-500">در حال جستجو...</div>
          )}

          {!isFetching && results.length === 0 && (
            <div className="p-4 text-sm text-gray-500">نتیجه‌ای پیدا نشد</div>
          )}
          {!isFetching &&
            results.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-start w-full hover:bg-stroke-100 px-3"
              >
                <Link
                  href={`/products/${item?.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-3 group transition w-full border-b border-stroke-150"
                >
                  {item?.image && (
                    <div className="size-14 flex items-center justify-center p-1.5 rounded-lg bg-stroke-150 dark:bg-stroke-100 group-hover:bg-stroke-0 duration-200">
                      <AppImage
                        src={item.image}
                        alt={item.perTitle}
                        className=""
                        width="size-full"
                        objectFit="cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 w-full text-stroke-800 flex flex-col items-start justify-center gap-1">
                    <p className="text-sm truncate font-bold">
                      {item.perTitle}
                    </p>

                    {item.enTitle && (
                      <p className="text-xs text-gray-500 truncate font-bold">
                        {item.enTitle}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          {!isFetching && results.length > 0 && (
            <div className="flex items-center justify-center w-full px-4 hover:bg-stroke-100">
              <button
                type="submit"
                className="w-full text-center p-3 text-sm text-stroke-800 font-medium"
              >
                مشاهده همه نتایج
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SearchSection;
