"use client";

import Link from "next/link";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";
import CategoriesListTable from "./CategoriesListTable";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";

function CategoriesLayout() {
  const {
    data: categories,
    isPending: isCategoriesPending,
    error: isCategoriesError,
  } = useGetAllCategories();
  const genderCategories = categories?.filter((c) => c.type === "gender");
  const accordCategories = categories?.filter((c) => c.type === "accord");
  const {
    data: brandCategoriess,
    isPending: isBrandsPending,
    error: isBrandsError,
  } = useGetAllBrandCategories();

  return (
    <div className="flex flex-col items-start justify-start gap-16">
      {/* Brands */}
      <div className="w-full px-6">
        <div className="flex items-center gap-4 justify-between pb-6 w-full">
          <h1 className="font-bold text-stroke-800 text-xl">برند‌ها</h1>
          <Link
            href="/admin/categories/brands/add"
            className="btn btn--primary py-1.5 px-3"
          >
            اضافه کردن برند
          </Link>
        </div>
        {isBrandsPending ? (
          <Loading />
        ) : (
          <CategoriesListTable categories={brandCategoriess} brands />
        )}
        {brandCategoriess && brandCategoriess?.length === 0 && (
          <NotExisted className="h-96">برندی وجود نداره!</NotExisted>
        )}
      </div>

      {/* Accords */}
      <div className="w-full px-6">
        <div className="flex items-center gap-4 justify-between pb-6 w-full">
          <h1 className="font-bold text-stroke-800 text-xl">رایحه‌ها</h1>
          <Link
            href="/admin/categories/accords/add"
            className="btn btn--primary py-1.5 px-3"
          >
            اضافه کردن رایحه
          </Link>
        </div>
        {isCategoriesPending ? (
          <Loading />
        ) : (
          <CategoriesListTable categories={accordCategories} accords />
        )}
        {accordCategories && accordCategories?.length === 0 && (
          <NotExisted className="h-96">رایحه‌ای وجود نداره!</NotExisted>
        )}
      </div>

      {/* Genders */}
      <div className="w-full px-6">
        <div className="flex items-center gap-4 justify-between pb-6 w-full">
          <h1 className="font-bold text-stroke-800 text-xl">جنسیت</h1>
          <Link
            href="/admin/categories/genders/add"
            className="btn btn--primary py-1.5 px-3"
          >
            اضافه کردن جنسیت
          </Link>
        </div>
        {isCategoriesPending ? (
          <Loading />
        ) : (
          <CategoriesListTable categories={genderCategories} genders />
        )}
        {genderCategories && genderCategories?.length === 0 && (
          <NotExisted className="h-96">جنسیتی وجود نداره!</NotExisted>
        )}
      </div>
    </div>
  );
}

export default CategoriesLayout;
