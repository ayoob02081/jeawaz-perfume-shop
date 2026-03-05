"use client";

import { signinApi } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SigninForm from "./SigninForm";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import PassInput from "@/ui/PassInput";

const formData = [
  {
    id: 1,
    label: "نام",
    name: "firstName",
    placeholder: "مثال: رضا",
  },
  {
    id: 2,
    label: "نام خانوادگی",
    name: "lastName",
    placeholder: "مثال: جنیدی",
  },

  {
    id: 3,
    label: "نام کاربری",
    name: "username",
    placeholder: "مثال: reza123",
  },
  // {
  //   id: 4,
  //   label: "شماره موبایل",
  //   name: "phoneNumber",
  //   placeholder: "مثال: 09123456789",
  // },
  {
    id: 5,
    label: "ایمیل",
    name: "email",
    placeholder: "مثال: example@example.com",
  },
];

function Signin({ closeBtn }) {
  const router = useRouter();

  const {
    data: signinData,
    isPending,
    error: signinError,
    mutateAsync: signinApifn,
  } = useMutation({
    mutationFn: signinApi,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const userData = {
    firstName: watch("firstName"),
    lastName: watch("lastName"),
    username: watch("username"),
    // phoneNumber: watch("phoneNumber"),
    email: watch("email"),
    password: watch("password"),
  };

  const isAllFieldesSet =
    userData.firstName?.length >= 3 &&
    userData.lastName?.length >= 3 &&
    userData.username?.length >= 4 &&
    // userData.phoneNumber?.length === 11 &&
    userData.email?.length >= 14 &&
    userData.password?.length >= 6;

  const handleSubmitForm = async (e) => {
    const { firstName, lastName, username, email, password } = e;
    const userData = {
      firstName,
      lastName,
      username,
      email,
      password,
    };

    try {
      const data = await signinApifn(userData);
      toast.success("ثبت نام با موفقیت انجام شد!");
      router.back();
    } catch (error) {
      toast.error(
        signinError?.response?.data?.message ||
          "خطا در ثبت نام. لطفا دوباره تلاش کنید.",
      );
    }
  };

  return (
    <div className="relative size-full p-6 md:p-10">
      <SigninForm
        closeBtn={closeBtn}
        handleSubmit={() => handleSubmit(handleSubmitForm)}
        MoveBack={() => {
          router.back();
        }}
        toggleModalOpen={() => {
          router.back();
        }}
        isAllFieldesSet={isAllFieldesSet}
      >
        <div className="flex flex-col w-full justify-between gap-10 overflow-auto scrollbar--primary scrollbar-w-2 px-4 py-1">
          {formData.map((item) => (
            <RHFTextField
              key={item.id}
              register={register}
              isRequired
              label={item.label}
              name={item.name}
              placeholder={item.placeholder}
              validationSchema={{ required: true }}
              className="textField__input textField__input--2 w-full"
            />
          ))}
          <PassInput
            RHForm
            isRequired
            label="رمز عبور"
            name="password"
            register={register}
            validationSchema={{ required: true }}
            className="textField__input textField__input--2 w-full"
            placeholder="رمز عبور"
          />
        </div>
      </SigninForm>
    </div>
  );
}

export default Signin;
