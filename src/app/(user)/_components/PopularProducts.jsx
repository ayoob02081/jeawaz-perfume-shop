"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function PopularProducts() {
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
      section={"popular"}
      titleOne={"پر فروش ترین"}
      titleTwo={"محصولات ما"}
      desc={"رایحه هایی که همیشه می درخشن"}
      className={
        " flex-col md:flex-row overflow-hidden sm:overflow-x-auto rounded-2xl"
      }
    >
      {data &&
        data.map((product) => (
          <div className="snap-center pb-6" key={product.id}>
            <ProductCard
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

export default PopularProducts;
