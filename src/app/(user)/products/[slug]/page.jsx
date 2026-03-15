import { getProductByIdApi } from "@/services/productServices";
import SingleProductPage from "../_components/SingleProductPage";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductByIdApi(slug);
  return {
    title: product.perTitle,
    description: product.description,
  };
}

async function page({ params }) {
  const { slug } = await params;

  return <SingleProductPage slug={slug} />;
}

export default page;
