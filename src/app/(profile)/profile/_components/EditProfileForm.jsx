"use client";
import toast, { Toaster } from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useGetUser, useUpdateUser } from "@/hooks/useUsers";
import PersianDateRHForm from "./PersianDateRHForm";

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
    // isRequired: true,
  },
  {
    id: 4,
    label: "کد ملی",
    name: "nationalCode",
    placeholder: "۰۱۲۳۴۵۶۷۸۹",
    type: "number",
    // isRequired: true,
  },
  // {
  //   id: 7,
  //   label: "تلفن ثابت",
  //   name: "tellNumber",
  //   placeholder: "۰۹۱-۳۴۵۶۷۸۹",
  //   type: "number",
  // },
  // {
  //   id: 8,
  //   label: "تولد",
  //   name: "birthday",
  //   placeholder: "۱۳۸۱/۲/۴",
  //   type: "date",
  // },
];

function EditProfileForm() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: userToEdit, isLoading, error } = useGetUser();
  const { isUpdating, updateUser } = useUpdateUser();
  const {
    firstName,
    lastName,
    phoneNumber,
    tellNumber,
    nationalCode,
    birthday,
    email,
    username,
    password,
  } = userToEdit || {};

  //   const { editUser, isEditing } = useEditUser(id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      phoneNumber: phoneNumber || "",
      nationalCode: nationalCode || "",
      birthday: birthday || "",
      email: email || "",
      username: username || "",
      password: password || "",
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      nationalCode: data.nationalCode,
      birthday: data.birthday,
      email: data.email,
      username: data.username,
      password: data.password,
    };

    // if (!!userToEdit) {

    try {
      await updateUser({
        id: userToEdit?.id,
        payload,
      });
      toast.success(
        `اطلاعات حساب کاربری ${data?.title || data?.phoneNumber} با موفقیت ویرایش شد`,
      );
      // router.back();
    } catch (error) {
      console.log(error);
      toast.error(`ویرایش اطلاعات حساب کاربری ${data?.title} با خطا مواجه شد`);
      error;
    }
    // }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:p-6 w-full">
      <Toaster />

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
                className="textField__input textField__input--2 rounded-xl w-full"
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
                className="textField__input textField__input--2 rounded-xl w-full"
                placeholder={`مثال: ${item.placeholder}`}
              />
            ),
          )}
          <PersianDateRHForm
            control={control}
            name="birthday"
            label="تولد"
            className="textField__input textField__input--2 rounded-xl w-full"
            placeholder="مثال: ۱۳۸۱/۲/۴"
          />
          <RHFTextField
            register={register}
            isRequired
            label="رمز ورود"
            name="password"
            type="password"
            className="textField__input textField__input--2 rounded-xl w-full"
            validationSchema={{ required: true }}
            // placeholder={`مثال: ${item.placeholder}`}
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
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
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
