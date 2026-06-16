"use client";

import { useGetAllUsers } from "@/hooks/useUsers";
import UsersListTable from "./UsersListTable";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

function UsersLayout() {
  const { data: users, isPending, error } = useGetAllUsers();

  if (error) return <Error />;

  return (
    <div className="space-y-2 max-lg:px-6 w-full!">
      <h1 className="font-bold text-secndary-900 text-xl pb-6 text-stroke-800">
        اطلاعات کاربران
      </h1>
      {isPending ? <Loading /> : <UsersListTable users={users} />}
    </div>
  );
}

export default UsersLayout;
