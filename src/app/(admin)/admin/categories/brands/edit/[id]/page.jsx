"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import {
  useGetBrandbyID,
  useGetBrandSearchAliases,
} from "@/hooks/useCategories";
import BrandForm from "@/app/(admin)/admin/categories/_components/BrandForm";

function EditBrandPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetBrandbyID(id);
  // Admin-only; the form is filled once, so it waits for the aliases too.
  const aliases = useGetBrandSearchAliases(id);
  const brand = data || {};

  if (isLoading || aliases.isLoading) return <Loading />;

  return (
    <BrandForm
      brandToEdit={brand}
      searchAliases={aliases.data?.searchAliases ?? null}
      searchAliasesUnavailable={aliases.isError}
    />
  );
}

export default EditBrandPage;
