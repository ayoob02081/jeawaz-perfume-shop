"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import { loginApi } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useGetAllUsers } from "@/hooks/useUsers";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import OTPInput from "react-otp-input";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";
import RHFLoginField from "@/ui/RHFLoginField";

const RESEND_TIME = 90;

function Login({ toggleModalOpen, closeBtn }) {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [otp, setOtp] = useState(""); //?
  const email = watch("email") || "";
  const phoneNumber = watch("phoneNumber") || "";
  const [step, setStep] = useState(1);
  const [isEmailType, setIsEmailType] = useState(true); // 'email' or 'phone'
  const [time, setTime] = useState(RESEND_TIME);
  const router = useRouter();
  const { isLoading: isGetting, data: users } = useGetAllUsers();

  const {
    data: loginData,
    isPending: isChecking,
    mutateAsync: loginApifn,
    error: loginError,
  } = useMutation({
    mutationFn: loginApi,
  });

  const toggleLoginType = () => {
    setIsEmailType((prevState) => !prevState);
  };

  const PasswordHandler = async (e) => {
    const { email, phoneNumber } = e;
    if (e.email) {
      if (step === 1 && email.length >= 11) {
        const isEmailExist = users?.data.find((user) => user.email === email);
        if (isEmailExist?.email === email) {
          setStep(2);
        } else {
          toast.error("ایمیل وارد شده وجود ندارد");
          reset();
        }
      }
    } else {
      if (step === 1 && phoneNumber.length >= 11) {
        const isPhoneNumberExist = users?.data.find(
          (user) => user.phoneNumber === phoneNumber,
        );

        if (isPhoneNumberExist === true) {
          setStep(2);
        } else {
          toast.error("شماره موبایل وارد شده وجود ندارد");
          reset();
        }
      }
    }
  };

  const handleSubmitForm = async (e) => {
    const { email, password, phoneNumber, otp } = e;
    if (email) {
      if (password.length >= 6) {
        const userData = {
          email,
          password,
        };
        try {
          const { accessToken, message } = await loginApifn(userData);
          if (accessToken && step === 2 && password.length >= 6) {
            router.back();
            toast.success("به جیاواز خوش آمدید!");
            reset();
          }
        } catch (error) {
          toast.error(
            loginError?.response?.data?.message ||
              "رمز نادرست است، لطفا مجددا تلاش کنید",
          );
        }
      }
    } else {
      if (otp.length === 6) {
        setOtp(otp);
        const userData = {
          phoneNumber,
          otp,
        };
        try {
          const { accessToken, message } = await loginApifn(userData);
          if (accessToken && step === 2 && otp.length >= 6) {
            router.back();
            toast.success("به جیاواز خوش آمدید!");
          }
        } catch (error) {
          toast.error(
            loginError?.response?.data?.message ||
              "کد نادرست است، لطفا مجددا تلاش کنید",
          );
        }
      }
    }
  };

  const MoveBack = () => {
    setStep(1);
    reset();
  };

  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <LoginForm
            toggleLoginType={toggleLoginType}
            isEmailType={isEmailType}
            password={watch("password") || ""}
            otp={otp}
            step={step}
            MoveBack={MoveBack}
            email={email}
            phoneNumber={phoneNumber}
            toggleModalOpen={toggleModalOpen}
            handleSubmit={() => handleSubmit(PasswordHandler)}
            closeBtn={closeBtn}
            // isGetting={isGetting}
          >
            <RHFLoginField
              step={step}
              register={register}
              isRequired
              isEmailType={isEmailType}
              errors={errors}
              email={email}
              phoneNumber={phoneNumber}
            />
          </LoginForm>
        );

      case 2:
        return (
          <LoginForm
            isEmailType={isEmailType}
            password={watch("password") || ""}
            otp={otp}
            step={step}
            MoveBack={MoveBack}
            email={email}
            phoneNumber={phoneNumber}
            toggleModalOpen={toggleModalOpen}
            handleSubmit={() => handleSubmit(handleSubmitForm)}
            closeBtn={closeBtn}

            // onResendOtp={SendOTPFormHandler}
            // time={time}
            // isChecking={isChecking}
          >
            <div className="flex items-center justify-center gap-2 w-full h-12 ">
              {isEmailType === false ? (
                <OTPInput
                  inputType="tel"
                  value={toPersianNumbers(otp)}
                  onChange={setOtp}
                  numInputs={5}
                  renderSeparator={<span> </span>}
                  inputStyle="flex items-center justify-center pl-4 md:pl-5.5 pt-1 max-md:size-11 md:size-14 bg-[#F1F1F1] rounded-full outline-0 text-stroke-800 max-md:text-lg md:text-xl duration-200"
                  containerStyle="flex max-md:gap-1 md:gap-2 items-center justify-center w-full focus-within:*:[input]:bg-stroke-0 focus-within:*:[input]:border focus-within:*:border-primary duration-200"
                  renderInput={(props) => <input {...props} />}
                  skipDefaultStyles
                />
              ) : (
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
              )}
            </div>
          </LoginForm>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative size-full p-6 md:p-10 md:px-14">
      {renderSteps()}
    </div>
  );
}

export default Login;
