import { cache } from "react";
import SingleProductPage from "../_components/SingleProductPage";
import { notFound } from "next/navigation";
import http from "@/services/httpServer";
import { isValidProductId, productUrl, socialMetadata } from "@/lib/seo.mjs";
import { buildProductJsonLd, serializeProductJsonLd } from "@/lib/productJsonLd.mjs";
import { productSeoTitle } from "@/lib/productSeo.mjs";

const getProduct = cache(async (id) => {
  if (!isValidProductId(id)) return null;

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

  const canonical = productUrl(product.id);
  // The same vetted public image URLs as the Product JSON-LD.
  const images = buildProductJsonLd(product, process.env.NEXT_PUBLIC_API_URL)?.image ?? [];
  // Complete page title (store name last), so the root template is not applied.
  const seoTitle = productSeoTitle(product);
  const title = seoTitle ? { absolute: seoTitle } : product.perTitle;
  return {
    title,
    description: product.description,
    alternates: { canonical },
    ...socialMetadata({ title, description: product.description, url: canonical, images }),
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
