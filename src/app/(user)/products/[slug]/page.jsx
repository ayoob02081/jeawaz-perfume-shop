import SingleProductPage from "../_components/SingleProductPage";

async function page({ params }) {
  const { slug } = await params;
  return <SingleProductPage slug={slug} />;
}

export default page;
