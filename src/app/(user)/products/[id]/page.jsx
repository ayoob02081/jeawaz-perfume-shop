import { cache } from "react";
import SingleProductPage from "../_components/SingleProductPage";
import { notFound } from "next/navigation";
import http from "@/services/httpServer";

const getProduct = cache(async (id) => {
  try {
    const { data } = await http.get(`/products/${id}`, {
      headers: { "Cache-Control": "no-store" },
    });
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) return { title: "محصولی یافت نشد" };

  return {
    title: product.perTitle,
    description: product.description,
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <SingleProductPage product={product} />;
}
