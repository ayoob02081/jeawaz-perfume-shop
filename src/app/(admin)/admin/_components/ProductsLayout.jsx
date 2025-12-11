"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import Link from "next/link";
import ProductsListTable from "./ProductsListTable";
import NotExisted from "@/components/NotExisted";

function ProductsLayout() {
  const { data, isPending, error } = useGetAllProducts();
  // console.log(data);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-6">
        <h1 className="font-bold text-secondary-900 text-xl">محصولات</h1>
        <Link href={"/admin/products/add"} className="btn btn--primary">
          اضافه کردن محصول
        </Link>
      </div>
      {data && data?.length > 0 ? (
        <ProductsListTable products={data} />
      ) : (
        <NotExisted className="h-96">محصولی تعریف نشده است!</NotExisted>
      )}
    </div>
  );
}

export default ProductsLayout;
