"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import ProductForm from "../../_components/ProductForm";
import {
  useGetProductById,
  useGetProductSearchAliases,
} from "@/hooks/useProducts";

function EditProductPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetProductById(id);
  // Admin-only; the form is filled once, so it waits for the aliases too.
  const aliases = useGetProductSearchAliases(id);
  const product = data || {};

  if (isLoading || aliases.isLoading) return <Loading />;

  return (
    <div>
      <ProductForm
        productToEdit={product}
        searchAliases={aliases.data?.searchAliases ?? null}
        searchAliasesUnavailable={aliases.isError}
      />
    </div>
  );
}

export default EditProductPage;
