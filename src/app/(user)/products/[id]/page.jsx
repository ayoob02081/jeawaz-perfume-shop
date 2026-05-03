import SingleProductPage from "../_components/SingleProductPage";
import httpServer from "@/services/httpServer";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: product } = await httpServer.get(`/products/${id}`);
  return {
    title: product.perTitle,
    description: product.description,
  };
}

async function page({ params }) {
  const { id } = await params;

  return <SingleProductPage slug={id} />;
}

export default page;
