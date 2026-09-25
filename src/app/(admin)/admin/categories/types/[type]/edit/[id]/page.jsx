"use client";

import { useParams } from "next/navigation";
import CategoryForm from "@/app/(admin)/admin/categories/_components/CategoryForm";
import { useGetCategorybyID } from "@/hooks/useCategories";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

const supportedTypes = ["season", "temperature", "character", "occasion"];

export default function EditCategoryPage() {
  const { type, id } = useParams();
  const { data: category, isLoading, error } = useGetCategorybyID(id);

  if (!supportedTypes.includes(type)) return <Error />;
  if (isLoading) return <Loading />;
  if (error || !category || category.type !== type) return <Error />;

  return <CategoryForm categoryToEdit={category} categoryType={type} />;
}
