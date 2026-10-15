import { cache } from "react";
import SingleProductPage from "../_components/SingleProductPage";
import { notFound } from "next/navigation";
import http from "@/services/httpServer";
import { productUrl } from "@/lib/seo.mjs";
import { buildProductJsonLd, serializeProductJsonLd } from "@/lib/productJsonLd.mjs";

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
    alternates: { canonical: productUrl(product.id) },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const jsonLd = buildProductJsonLd(product, process.env.NEXT_PUBLIC_API_URL);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeProductJsonLd(jsonLd) }}
        />
      )}
      <SingleProductPage product={product} />
    </>
  );
}
