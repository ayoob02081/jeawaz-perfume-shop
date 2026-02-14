"use client";

import { signinApi } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SigninForm from "./SigninForm";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import PassInput from "@/ui/PassInput";

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
    formState: { errors },
  } = useForm();

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
      console.log(data);
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
    <div className="relative size-full p-6 md:p-10 md:px-14">
      <SigninForm
        closeBtn={closeBtn}
        handleSubmit={() => handleSubmit(handleSubmitForm)}
        MoveBack={() => {
          router.back();
        }}
        toggleModalOpen={() => {
          router.back();
        }}
        isAllFieldesSet={true}
      >
        <div className="flex flex-col w-full justify-between gap-10 overflow-auto scrollbar--primary scrollbar-w-2 p-4">
          <RHFTextField
            register={register}
            isRequired
            label="نام"
            name="firstName"
            className="textField__input textField__input--2 w-full"
            placeholder="مثال: رضا"
            validationSchema={{ required: true }}
          />
          <RHFTextField
            register={register}
            isRequired
            label="نام خانوادگی"
            name="lastName"
            className="textField__input textField__input--2 w-full"
            validationSchema={{ required: true }}
            placeholder="مثال: جنیدی"
          />
          <RHFTextField
            register={register}
            isRequired
            label="نام کاربری"
            name="username"
            className="textField__input textField__input--2 w-full"
            validationSchema={{ required: true }}
            placeholder="مثال: reza123"
          />
          {/* <RHFTextField
          register={register}
          isRequired
          label="شماره موبایل"
          name="phoneNumber"
          className="textField__input textField__input--2 w-full"
          validationSchema={{ required: true }}
          placeholder="مثال: 09123456789"
        /> */}
          <RHFTextField
            register={register}
            isRequired
            label="ایمیل"
            name="email"
            className="textField__input textField__input--2 w-full"
            validationSchema={{ required: true }}
            placeholder="مثال: example@example.com"
          />
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
