"use client";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import { useGetUser, useUpdateUser } from "@/hooks/useUsers";
import PersianDateRHForm from "../../../../ui/PersianDateRHForm";
import { useEffect } from "react";

const basicInfoData = [
  {
    id: 1,
    label: "نام",
    name: "firstName",
    placeholder: "رضا",
    type: "text",
    isRequired: true,
  },
  {
    id: 2,
    label: "نام خانوادگی",
    name: "lastName",
    placeholder: "کریمی",
    type: "text",
    isRequired: true,
  },
  {
    id: 3,
    label: "شماره موبایل",
    name: "phoneNumber",
    placeholder: "۰۹۱۲۳۴۵۶۷۸۹",
    type: "number",
    isRequired: true,
  },
  {
    id: 6,
    label: "نام کاربری",
    name: "username",
    placeholder: "RezaJ",
    type: "text",
    isRequired: true,
  },
  {
    id: 5,
    label: "ایمیل",
    name: "email",
    placeholder: "example@gmail.com",
    type: "email",
  },
  {
    id: 4,
    label: "کد ملی",
    name: "nationalCode",
    placeholder: "۰۱۲۳۴۵۶۷۸۹",
    type: "number",
  },
];

function EditProfileForm() {
  const router = useRouter();
  const { data: userToEdit, isLoading, error } = useGetUser();
  const { isUpdating, updateUser } = useUpdateUser(userToEdit?.id);
  const {
    firstName,
    lastName,
    phoneNumber,
    nationalCode,
    birthday,
    email,
    username,
  } = userToEdit || {};

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      nationalCode: undefined,
      birthday: undefined,
      email: undefined,
      username: undefined,
    },
  });

  useEffect(() => {
    if (!userToEdit) return;

    reset({
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      phoneNumber: phoneNumber ?? "",
      nationalCode: nationalCode || undefined,
      birthday: birthday || undefined,
      email: email || undefined,
      username: username || undefined,
    });
  }, [userToEdit, reset]);

  const onSubmit = async (data) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      nationalCode: data.nationalCode,
      birthday: data.birthday,
      email: data.email || undefined,
      username: data.username,
    };

    await updateUser(payload);
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {basicInfoData.map((item) =>
            item.isRequired ? (
              <RHFTextField
                key={item.name}
                register={register}
                isRequired
                label={item.label}
                name={item.name}
                type={item.type}
                className="w-full"
                validationSchema={{ required: true }}
                placeholder={`مثال: ${item.placeholder}`}
              />
            ) : (
              <RHFTextField
                key={item.name}
                register={register}
                label={item.label}
                name={item.name}
                type={item.type}
                className="w-full"
                placeholder={`مثال: ${item.placeholder}`}
              />
            ),
          )}
          <PersianDateRHForm
            control={control}
            name="birthday"
            label="تولد"
            className="w-full"
            placeholder="مثال: ۱۳۸۱/۲/۴"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              disabled={isSubmitting}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isLoading ? "در حال ویرایش..." : "ویرایش اطلاعات"}
            </button>
            <div
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditProfileForm;
