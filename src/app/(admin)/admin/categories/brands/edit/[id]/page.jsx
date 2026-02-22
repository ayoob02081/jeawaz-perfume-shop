"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useGetBrandbyID } from "@/hooks/useCategories";
import BrandForm from "@/app/(admin)/admin/_components/BrandForm";

function EditBrandPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetBrandbyID(id);
  const brand = data || {};

  if (isLoading) return <Loading />;

  return (
    <div>
      <BrandForm brandToEdit={brand} />
    </div>
  );
}

export default EditBrandPage;
