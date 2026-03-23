"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import ProductForm from "../../../_components/ProductForm";
import { useGetProductsbyId } from "@/hooks/useProducts";

function EditProductPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetProductsbyId(id);
  const product = data || {};

  if (isLoading) return <Loading />;

  return (
    <div>
      <ProductForm productToEdit={product} />
    </div>
  );
}

export default EditProductPage;
