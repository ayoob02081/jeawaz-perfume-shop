"use client";

import { useGetAllUsers } from "@/hooks/useUsers";
import UsersListTable from "./UsersListTable";
import Loading from "@/components/Loading";

function UsersLayout() {
  const { data, isPending, error } = useGetAllUsers();

  return (
    <div className="space-y-2 px-6">
      <h1 className="font-bold text-secondary-900 text-xl pb-6">
        اطلاعات کاربران
      </h1>
      {isPending ? <Loading /> : <UsersListTable users={data?.data} />}
    </div>
  );
}

export default UsersLayout;
