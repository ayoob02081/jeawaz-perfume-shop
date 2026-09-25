"use client";

import Link from "next/link";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";
import CategoriesListTable from "./CategoriesListTable";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
  useGetCategoriesByType,
} from "@/hooks/useCategories";
import RadioButton from "@/ui/RadioButton";
import { useState } from "react";

const categoriesMode = [
  {
    id: 1,
    label: "برندها",
    value: "brands",
  },
  {
    id: 2,
    label: "رایحه‌ها",
    value: "fragranceFamilies",
  },
  {
    id: 3,
    label: "جنسیت‌ها",
    value: "genders",
  },
  { id: 4, label: "فصل‌ها", value: "season" },
  { id: 5, label: "دما", value: "temperature" },
  { id: 6, label: "شخصیت رایحه", value: "character" },
  { id: 7, label: "موقعیت استفاده", value: "occasion" },
];

const additionalTypes = ["season", "temperature", "character", "occasion"];

function CategoriesLayout() {
  const [mode, setMode] = useState("brands");
  const { data: genderCategories, isPending: isGendersPending } =
    useGetCategoriesByType("gender");
  const { data: fragranceFamilyCategories, isPending: isFamiliesPending } =
    useGetCategoriesByType("fragrance_family");
  const { data: allCategories, isPending: isAllCategoriesPending } =
    useGetAllCategories();
  const {
    data: brandCategoriess,
    isPending: isBrandsPending,
    error: isBrandsError,
  } = useGetAllBrandCategories();

  return (
    <div className="flex flex-col items-start justify-start gap-8 max-lg:py-4 px-4 w-full pb-10">
      <div className="flex items-center justify-between gap-6 w-full">
        {categoriesMode.map((item) => {
          const isChecked = item.value === mode;
          return (
            <RadioButton
              key={item.id}
              className="w-full"
              name="categoryModes"
              checked={isChecked}
              onChange={() => setMode(item.value)}
              value={item.value}
            >
              <p
                className={`flex items-center justify-center py-2 px-3 border-[1.5px] rounded-full w-full ${isChecked ? "font-bold text-primary border-primary" : "text-stroke-500 border-stroke-500"} transition-all duration-200`}
              >
                {item.label}
              </p>
            </RadioButton>
          );
        })}
      </div>

      {/* Brands */}
      {mode === "brands" && (
        <div className="w-full">
          <div className="flex items-center gap-4 justify-between pb-6 w-full">
            <h1 className="font-bold text-stroke-800 text-xl">برند‌ها</h1>
            <Link
              href="/admin/categories/brands/add"
              className="btn btn--primary border py-1.5 px-3"
            >
              اضافه کردن برند
            </Link>
          </div>
          {isBrandsPending ? (
            <Loading />
          ) : (
            <CategoriesListTable categories={brandCategoriess} brands />
          )}
          {brandCategoriess &&
            !isBrandsPending &&
            brandCategoriess?.length === 0 && (
              <NotExisted className="h-96">برندی وجود نداره!</NotExisted>
            )}
        </div>
      )}

      {/* Accords */}
      {mode === "fragranceFamilies" && (
        <div className="w-full">
          <div className="flex items-center gap-4 justify-between pb-6 w-full">
            <h1 className="font-bold text-stroke-800 text-xl">رایحه‌ها</h1>
            <Link
              href="/admin/categories/accords/add"
              className="btn btn--primary border py-1.5 px-3"
            >
              اضافه کردن رایحه
            </Link>
          </div>
          {isFamiliesPending ? (
            <Loading />
          ) : (
            <CategoriesListTable categories={fragranceFamilyCategories} fragranceFamilies />
          )}
          {fragranceFamilyCategories && fragranceFamilyCategories?.length === 0 && (
            <NotExisted className="h-96">رایحه‌ای وجود نداره!</NotExisted>
          )}
        </div>
      )}

      {/* Genders */}
      {mode === "genders" && (
        <div className="w-full">
          <div className="flex items-center gap-4 justify-between pb-6 w-full">
            <h1 className="font-bold text-stroke-800 text-xl">جنسیت</h1>
            <Link
              href="/admin/categories/genders/add"
              className="btn btn--primary border py-1.5 px-3"
            >
              اضافه کردن جنسیت
            </Link>
          </div>
          {isGendersPending ? (
            <Loading />
          ) : (
            <CategoriesListTable categories={genderCategories} genders />
          )}
          {genderCategories && genderCategories?.length === 0 && (
            <NotExisted className="h-96">جنسیتی وجود نداره!</NotExisted>
          )}
        </div>
      )}

      {additionalTypes.includes(mode) && (
        <div className="w-full">
          <div className="flex items-center gap-4 justify-between pb-6 w-full">
            <h1 className="font-bold text-stroke-800 text-xl">
              {categoriesMode.find((item) => item.value === mode)?.label}
            </h1>
            <Link
              href={`/admin/categories/types/${mode}/add`}
              className="btn btn--primary border py-1.5 px-3"
            >
              افزودن دسته‌بندی
            </Link>
          </div>
          {isAllCategoriesPending ? (
            <Loading />
          ) : (
            <CategoriesListTable
              categories={allCategories?.filter((category) => category.type === mode)}
              categoryRoute={`types/${mode}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default CategoriesLayout;
