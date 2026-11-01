import UsersLayout from "./_components/UsersLayout";
import { Suspense } from "react";
import Loading from "@/components/Loading";

function UsersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <UsersLayout />
    </Suspense>
  );
}

export default UsersPage;
