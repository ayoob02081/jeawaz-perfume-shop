"use client";

import { useGetAllUsers } from "@/hooks/useUsers";
import UsersListTable from "./UsersListTable";

function UsersLayout() {
  const { data, isPending, error } = useGetAllUsers();
  console.log(data);

  return (
    <div className="space-y-2">
      <h1 className="font-bold text-secondary-900 text-xl pb-6">
        اطلاعات کاربران
      </h1>
      <UsersListTable users={data?.data} />
    </div>
  );
}

export default UsersLayout;
