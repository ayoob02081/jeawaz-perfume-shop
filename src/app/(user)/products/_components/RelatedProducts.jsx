import { fetchRelatedProducts } from "@/lib/relatedProducts.server.mjs";
import { categoryLandingPath } from "@/lib/seo.mjs";
import { categoryLandingHeading } from "@/lib/listingSeo.mjs";
import RelatedProductsSection from "./RelatedProductsSection";

// "More like this": the Product's first active fragrance family landing,
// named like that landing's own heading.
export function relatedMoreLink(product) {
  for (const category of [product?.categories?.fragranceFamilies].flat()) {
    const href = categoryLandingPath("fragranceFamilies", category);
    const heading = href && categoryLandingHeading("fragrance_family", category.title);
    if (heading) return { href, label: "مشاهده " + heading };
  }
  return null;
}

// Server-rendered under its own Suspense boundary: the product content never
// waits for these reads, and no suitable candidates means no section.
export default async function RelatedProducts({ product }) {
  const products = await fetchRelatedProducts({
    apiUrl: process.env.NEXT_PUBLIC_API_URL, product,
  });
  if (!products.length) return null;
  return <RelatedProductsSection products={products} more={relatedMoreLink(product)} />;
}
