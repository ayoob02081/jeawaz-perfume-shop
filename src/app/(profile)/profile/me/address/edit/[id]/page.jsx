"use client";

import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { useParams } from "next/navigation";
import { useGetAddressById } from "@/hooks/useAddress";
import AddressFormLayout from "@/app/(profile)/profile/_components/AddressFormLayout";
import {
  getAddressFormKey,
  isEditableAddress,
} from "@/utils/addressFormContract.mjs";

function EditAddressPage() {
  const { id } = useParams();
  const { data: address, isLoading } = useGetAddressById(id);

  if (isLoading) return <Loading />;

  // A failed or missing load has no id to PATCH: never render an edit form.
  if (!isEditableAddress(address)) return <Error />;

  return (
    <AddressFormLayout
      key={getAddressFormKey(address)}
      addressToEdit={address}
    />
  );
}

export default EditAddressPage;
