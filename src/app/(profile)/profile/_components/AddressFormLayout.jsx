"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  useCreateAddress,
  useEditAddress,
  useRemoveAddress,
} from "@/hooks/useAddress";
import AddressForm from "@/components/AddressForm";
import RHFTextField from "@/ui/RHFTextField";
import { useState } from "react";
import {
  addressToFormValues,
  createProvinceChangeHandler,
  submitAddressForm,
} from "@/utils/addressFormContract.mjs";

// Built once per authoritative address: the edit page keys this component by
// getAddressFormKey(address), so fresh server data remounts it with matching
// form values and isDefault.
function AddressFormLayout({ addressToEdit }) {
  const router = useRouter();

  const [isDefault, setIsDefault] = useState(!!addressToEdit?.isDefault);

  const { isDeleting, removeAddress } = useRemoveAddress();

  const removeAddressHandler = async (address) => {
    try {
      await removeAddress(address.id);
      router.back();
    } catch {
      // useRemoveAddress already reported the failure.
    }
  };

  const { createAddress, isCreating } = useCreateAddress();
  const { editAddress, isUpdating } = useEditAddress();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: addressToFormValues(addressToEdit),
  });

  const isPending = isSubmitting || isCreating || isUpdating;

  const onSubmit = async (values) => {
    const result = await submitAddressForm({
      addressToEdit,
      values,
      isDefault,
      createAddress,
      editAddress,
    });

    if (result.ok) router.back();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full px-4">
      <div className="flex flex-col justify-center gap-6 w-full">
        <RHFTextField
          isRequired
          register={register}
          errors={errors}
          label="عنوان آدرس"
          name="label"
          className="w-full"
          textClassName="font-bold"
          placeholder="مثال : آدرس خانه"
          validationSchema={{
            required: "نام آدرس الزامی است",
          }}
        />
        <AddressForm
          control={control}
          errors={errors}
          register={register}
          watch={watch}
          reset={reset}
          onProvinceChange={createProvinceChangeHandler(setValue)}
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
            disabled={isPending}
            className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
          >
            {!addressToEdit
              ? isPending
                ? "در حال ساخت..."
                : "ساخت آدرس"
              : isPending
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
