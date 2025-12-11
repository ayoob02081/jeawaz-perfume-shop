// "use client";

// import Loading from "@/components/Loading";
// import { useParams } from "next/navigation";
// import { useGetProductById } from "@/hooks/useProducts";
// import GoBack from "@/ui/GoBack";

// function SingleProductPage() {
//   const { id } = useParams();
//   const { data, isLoading } = useGetProductById(id);
//   const { product } = data || {};

//   if (isLoading) return <Loading />;

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="font-bold text-secondary-900">اطلاعات محصول</h1>
//         <GoBack />
//       </div>
//       <div>{product.title}</div>
//     </div>
//   );
// }

// export default SingleProductPage;

import React from "react";
import ProductForm from "../../_components/ProductForm";

function page() {
  return <ProductForm />;
}

export default page;
