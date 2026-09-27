"use client";

import { useParams } from "next/navigation";
import CategoryForm from "@/app/(admin)/admin/categories/_components/CategoryForm";
import Error from "@/components/Error";

const supportedTypes = [
  "fragrance_family",
  "gender",
  "season",
  "temperature",
  "character",
  "occasion",
];

export default function AddCategoryPage() {
  const { type } = useParams();
  if (!supportedTypes.includes(type)) return <Error />;
  return <CategoryForm categoryType={type} />;
}
