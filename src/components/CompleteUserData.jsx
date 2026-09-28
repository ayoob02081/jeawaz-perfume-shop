"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useAuth } from "@/contexts/auth/AuthContext";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import AuthLayout from "@/app/(user)/auth/_components/AuthLayout";
import { PERSIAN_NAME_PATTERN } from "@/utils/profileFormContract.mjs";

const formData = [
  {
    id: 1,
    label: "نام",
    name: "firstName",
    type: "text",
    validationSchema: {
      required: "نام الزامی است",
      minLength: {
        value: 2,
        message: "نام باید حداقل ۲ کاراکتر باشد",
      },
      maxLength: {
        value: 50,
        message: "نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد",
      },
      pattern: {
        value: PERSIAN_NAME_PATTERN,
        message: "نام فقط می‌تواند شامل حروف فارسی باشد",
      },
    },
    placeholder: "نام",
  },
  {
    id: 2,
    label: "نام خانوادگی",
    name: "lastName",
    type: "text",
    validationSchema: {
      required: "نام خانوادگی الزامی است",
      minLength: {
        value: 2,
        message: "نام خانوادگی باید حداقل ۲ کاراکتر باشد",
      },
      maxLength: {
        value: 50,
        message: "نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد",
      },
      pattern: {
        value: PERSIAN_NAME_PATTERN,
        message: "نام خانوادگی فقط می‌تواند شامل حروف فارسی باشد",
      },
    },
    placeholder: "نام خانوادگی",
  },
];

function CompleteUserData() {
  const router = useRouter();
  const { updateUser, loading: isPending } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const userData = {
    firstName: watch("firstName"),
    lastName: watch("lastName"),
  };

  const isAllFieldesSet =
    userData.firstName?.length <= 2 || userData.lastName?.length <= 2;

  const handleSubmitForm = async (e) => {
    const { firstName, lastName } = e;

    try {
      await updateUser({
        firstName,
        lastName,
      });
      toast.success("ثبت اطلاعات با موفقیت انجام شد!");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "خطا در ثبت اطلاعات. لطفا دوباره تلاش کنید.",
      );
    }
  };

  const onSubmit = handleSubmit(handleSubmitForm);

  return (
    <Modal
      isOpen={() => router.back()}
      onClose={() => router.back()}
      className="h-fit justify-end"
    >
      <div className="relative size-full p-6 md:p-10">
        <form
          className="flex flex-col items-center justify-between max-md:gap-6 md:gap-8 size-full"
          onSubmit={onSubmit}
        >
          <AuthLayout>
            <div className="flex flex-col w-full justify-between gap-4">
              {formData.map((item) => (
                <RHFTextField
                  key={item.id}
                  register={register}
                  isRequired
                  name={item.name}
                  type={item.type}
                  errors={errors}
                  placeholder={item.placeholder}
                  validationSchema={item.validationSchema}
                  className="rounded-full w-full h-12 md:h-14"
                  isPrimary
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={isAllFieldesSet}
              className=" btn btn--primary w-full px-3 py-2 h-12 md:h-14 border-0 "
            >
              {isPending ? <Loading bgColor="white" /> : "تایید اطلاعات"}
            </button>
          </AuthLayout>
        </form>
      </div>
    </Modal>
  );
}

export default CompleteUserData;
