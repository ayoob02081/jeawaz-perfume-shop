"use client";

import Loading from "@/components/Loading";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import { useGetAllProducts } from "@/hooks/useProducts";
import Error from "@/components/Error";

function RecentProducts() {
  const { data, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }
  return (
    <HomePageProducts
      genderType="true"
      section={"recent"}
      titleOne={"جدید ترین "}
      titleTwo={"محصولات ما"}
      desc={"ترندهای رایحه، همین‌جاست."}
      className={"rounded-2xl"}
    >
      <div></div>
      {data &&
        data.map((product) => (
          <div className="snap-center pb-6" key={product.id}>
            <ProductCard
              productId={product.id}
              src={product.src}
              alt={product.alt}
              gender={product.gender}
              scent={product.scent}
              brand={product.brand}
              enTitle={product.enTitle}
              perTitle={product.perTitle}
              offValue={product.offValue}
              price={product.price}
              original
            />
          </div>
        ))}
    </HomePageProducts>
  );
}

export default RecentProducts;
