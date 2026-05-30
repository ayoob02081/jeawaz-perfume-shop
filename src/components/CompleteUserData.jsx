"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import AuthLayout from "@/app/(user)/auth/_components/AuthLayout";

const formData = [
  {
    id: 1,
    label: "نام",
    name: "firstName",
    type: "text",
    validationSchema: {
      required: "نام الزامی است",
      pattern: {
        value: /^[a-zA-Zآ-ی\s]+$/,
        message: "فقط حروف مجاز است",
      },
      minLength: {
        value: 2,
        message: "حداقل ۲ کاراکتر",
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
      pattern: {
        value: /^[a-zA-Zآ-ی\s]+$/,
        message: "فقط حروف مجاز است",
      },
      minLength: {
        value: 2,
        message: "حداقل ۲ کاراکتر",
      },
    },
    placeholder: "نام خانوادگی",
  },
];

function CompleteUserData() {
  const router = useRouter();
  const { updateUser, isPending } = useAuth();

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
