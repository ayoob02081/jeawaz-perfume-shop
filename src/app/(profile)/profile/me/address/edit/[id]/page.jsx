"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useGetAddressById } from "@/hooks/useAddress";
import AddressFormLayout from "@/app/(profile)/profile/_components/AddressFormLayout";

function EditAddressPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetAddressById(id);
  const address = data || {};

  if (isLoading) return <Loading />;

  return (
    <div>
      <AddressFormLayout addressToEdit={address} />
    </div>
  );
}

export default EditAddressPage;
