"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useGetAllUsers } from "@/hooks/useUsers";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import OTPInput from "react-otp-input";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";
import RHFLoginField from "@/ui/RHFLoginField";
import { useAuth } from "@/contexts/filters/auth/AuthContext";

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
  const { login } = useAuth();

  const toggleLoginType = () => {
    setIsEmailType((prevState) => !prevState);
  };

  const PasswordHandler = async (e) => {
    const { email, phoneNumber } = e;
    if (e.email) {
      if (step === 1 && email.length >= 11) {
        const isEmailExist = users.find((user) => user.email === email);

        if (isEmailExist) {
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

        if (isPhoneNumberExist) {
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

    try {
      let userData;

      if (email) {
        if (password.length < 6) return toast.error("رمز عبور کوتاه است");

        userData = { email, password };
      } else {
        if (otp.length < 5) return toast.error("کد تکمیل نشده");

        userData = { phoneNumber, otp };
      }
      await login(userData);
      toast.success("به جیاواز خوش آمدید!");
      reset();
      router.back();
    } catch {
      toast.error("ورود ناموفق بود، دوباره تلاش کنید");
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
