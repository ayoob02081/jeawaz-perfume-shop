"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import CategoryForm from "@/app/(admin)/admin/_components/CategoryForm";
import { useGetCategorybyID } from "@/hooks/useCategories";

function EditCategoryPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetCategorybyID(id);
  const category = data || {};

  if (isLoading) return <Loading />;

  return (
    <div>
      <CategoryForm categoryToEdit={category} gender="gender" />
    </div>
  );
}

export default EditCategoryPage;
