import { cache } from "react"; // <--- این خیلی مهمه
import SingleProductPage from "../_components/SingleProductPage";
import httpServer from "@/services/httpServer";
import { notFound } from "next/navigation";

const getProduct = cache(async (id) => {
  try {
    const { data } = await httpServer.get(`/products/${id}`, {
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
