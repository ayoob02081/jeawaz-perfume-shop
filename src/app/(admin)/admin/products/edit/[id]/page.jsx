// "use client";

// import Loading from "@/components/Loading";
// import { useParams } from "next/navigation";
// import { useGetProductById } from "@/hooks/useProducts";
// import ProductForm from "../../../_components/ProductForm";
// import GoBack from "@/ui/GoBack";

// function EditProductPage() {
//   const { id } = useParams();
//   const { data, isLoading } = useGetProductById(id);
//   const { product } = data || {};

//   if (isLoading) return <Loading />;

//   return (
//     <div className="space-y-8 w-full max-w-sm h-auto">
//       <div className="flex items-center justify-between">
//         <h1 className="font-bold text-secondary-900 text-xl">ویرایش محصول</h1>
//         <GoBack />
//       </div>
//       <ProductForm productToEdit={product} />
//     </div>
//   );
// }

// export default EditProductPage;
