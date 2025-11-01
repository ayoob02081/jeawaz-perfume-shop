"use client";

import { useGetAllProducts } from "@/hooks/useProducts";
import HomePageProducts from "./HomePageProducts";
import ProductCard from "./ProductCard";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function OffProducts() {
  const { data, isLoading, error } = useGetAllProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error />;
  }

  return (
    <HomePageProducts
      titleOne={"پرتخفیف ترین"}
      titleTwo={"محصولات"}
      desc={"پرتخفیف ترین رایحه ها ، همین‌جاست."}
      className={""}
      bgColor="bg-[#FFF4F8] rounded-2xl py-6"
    >
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

export default OffProducts;
