import { Suspense } from "react";
import Loading from "@/components/Loading";
import AddProductPage from "../_components/AddProductPage";

function page() {
  return (
    <Suspense fallback={<Loading />}>
      <AddProductPage />
    </Suspense>
  );
}

export default page;
