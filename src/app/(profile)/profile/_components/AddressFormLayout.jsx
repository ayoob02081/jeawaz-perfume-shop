"use client";

import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useCreateAddress,
  useEditAddress,
  useRemoveAddress,
} from "@/hooks/useAddress";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import AddressForm from "@/components/AddressForm";
import RHFTextField from "@/ui/RHFTextField";
import { useState } from "react";

function AddressFormLayout({ addressToEdit }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    id,
    label,
    fullName,
    phoneNumber,
    ostan,
    shahr,
    postalCode,
    addressLine,
    isDefault: isAddressDefault,
  } = addressToEdit || {};
  const [isDefault, setIsDefault] = useState(isAddressDefault || false);

  const { isDeleting, removeAddress } = useRemoveAddress();

  const removeAddressHandler = async (address) => {
    const { id, title } = address;
    await removeAddress(id);
    router.back();
  };

  const { createAddress, isAdding } = useCreateAddress();
  const { editAddress, isEditing } = useEditAddress(id);
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      label: addressToEdit ? label : "",
      fullName: addressToEdit ? fullName : "",
      phoneNumber: addressToEdit ? phoneNumber : "",
      ostan: addressToEdit ? ostan : "",
      shahr: addressToEdit ? shahr : "",
      postalCode: addressToEdit ? postalCode : "",
      addressLine: addressToEdit ? addressLine : "",
      isDefault: false,
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      isDefault: isDefault,
    };
    console.log("Final Data:", payload);
    if (!addressToEdit) {
      await createAddress(payload);
      router.back();
    }

    if (!!addressToEdit) {
      await editAddress({
        addressId: id,
        data: payload,
      });
      router.back();
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col  justify-center gap-6 w-full max-md:px-6">
        <RHFTextField
          register={register}
          errors={errors}
          label="عنوان آدرس"
          name="label"
          className="w-full"
          labelClassName="font-bold"
          placeholder="مثال : آدرس خانه"
        />
        <AddressForm
          control={control}
          errors={errors}
          register={register}
          watch={watch}
          reset={reset}
          onChange={() => setIsDefault(!isDefault)}
          isChecked={isDefault}
          checkBoxLabel="ذخیره به عنوان پیشفرض"
          checkBoxName="isDefault"
          checkBoxId="isDefault"
        />
      </div>
      <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
        <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
          <button
            type="submit"
            disabled={isSubmitting || isEditing}
            className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
          >
            {!addressToEdit
              ? isSubmitting
                ? "در حال ساخت..."
                : "ساخت آدرس"
              : isEditing
                ? "در حال ویرایش..."
                : "ویرایش آدرس"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
          >
            بازگشت
          </button>
        </div>
        {addressToEdit && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => removeAddressHandler(addressToEdit)}
            className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
          >
            {isDeleting ? "در حال حذف..." : "حذف آدرس"}
          </button>
        )}
      </div>
    </form>
  );
}

export default AddressFormLayout;
