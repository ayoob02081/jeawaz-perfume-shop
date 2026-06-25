"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import Link from "next/link";
import ProductsListTable from "./ProductsListTable";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";

function ProductsLayout() {
  const { data, isLoading, error } = useGetAllProducts();
 const products = data?.data || [];
  const meta = data?.meta;
  return (
    <div className="space-y-2 w-full max-lg:px-6">
      <div className="flex items-center gap-4 justify-between pb-6 w-full">
        <h1 className="font-bold text-stroke-800 text-xl">محصولات</h1>
        <Link
          href={"/admin/products/add"}
          className="btn btn--primary border py-1.5 px-3"
        >
          اضافه کردن محصول
        </Link>
      </div>
      {isLoading ? <Loading /> : <ProductsListTable products={products} />}
      {products && products?.length === 0 && (
        <NotExisted className="h-96">محصولی تعریف نشده است!</NotExisted>
      )}
    </div>
  );
}

export default ProductsLayout;
