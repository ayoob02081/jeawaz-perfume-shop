"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import Link from "next/link";
import ProductsListTable from "./ProductsListTable";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";

function ProductsLayout() {
  const { data, isPending, error } = useGetAllProducts();

  return (
    <div className="space-y-2 w-full px-6">
      <div className="flex items-center gap-4 justify-between pb-6 w-full">
        <h1 className="font-bold text-text text-xl">محصولات</h1>
        <Link
          href={"/admin/products/add"}
          className="btn btn--primary py-1.5 px-3"
        >
          اضافه کردن محصول
        </Link>
      </div>
      {isPending ? <Loading /> : <ProductsListTable products={data} />}
      {data && data?.length === 0 && (
        <NotExisted className="h-96">محصولی تعریف نشده است!</NotExisted>
      )}
    </div>
  );
}

export default ProductsLayout;
