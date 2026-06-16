"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import LoginForm from "./LoginForm";
import { requestOtpApi, verifyOtpApi } from "@/services/authServices";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import useOtpTimer from "@/hooks/useOtpTimer";
import RHFTextField from "@/ui/RHFTextField";
import PersianOTPInput from "@/ui/PersianOTPInput";

function Login({ closeBtn }) {
  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [otp, setOtp] = useState("");
  const phoneNumber = watch("phoneNumber") || "";
  const [step, setStep] = useState(1);
  const [isPasswordType, setIsPasswordType] = useState(false);
  const { remaining, startTimer } = useOtpTimer();

  const router = useRouter();

  const { checkAuth, login } = useAuth();

  const togglePasswordType = () => {
    setIsPasswordType((prevState) => !prevState);
  };

  const PasswordHandler = async (e) => {
    const { phoneNumber } = e;

    try {
      if (phoneNumber && !/^09\d{9}$/.test(phoneNumber))
        return toast.error("شماره موبایل نامعتبر است");

      if (phoneNumber && remaining <= 0) {
        const res = await requestOtpApi({ phoneNumber });
        const expiresAt = new Date(res.expiresAt).getTime();
        setStep(2);
        startTimer(expiresAt);
        return res?.message;
      }
      setStep(2);
    } catch (err) {
      if (!isPasswordType) {
        console.error("خطا در ارسال کد", err);
      }
      console.error(err);
    }
  };

  const handleSubmitForm = async (e) => {
    const { password, phoneNumber } = e;

    try {
      if (isPasswordType) {
        if (password.length < 6) return toast.error("رمز عبور کوتاه است");

        await login({ phoneNumber, password });
      } else {
        if (otp.length < 5) return toast.error("کد تکمیل نشده");
        await verifyOtpApi({ phoneNumber, code: otp });
        checkAuth();
      }

      toast.success("به جیاواز خوش آمدید!");
      router.back();
    } catch {
      toast.error("ورود ناموفق بود، دوباره تلاش کنید");
    }
  };

  const MoveBack = () => {
    setStep(1);
    reset();
  };

  const submitStep1 = handleSubmit(PasswordHandler);
  const submitStep2 = handleSubmit(handleSubmitForm);

  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <LoginForm
            togglePasswordType={togglePasswordType}
            isPasswordType={isPasswordType}
            password={watch("password") || ""}
            otp={otp}
            step={step}
            MoveBack={MoveBack}
            phoneNumber={phoneNumber}
            onClose={() => router.back()}
            onSubmit={submitStep1}
            closeBtn={closeBtn}
          >
            <RHFTextField
              name="phoneNumber"
              type="tel"
              control={control}
              errors={errors}
              icon={DevicePhoneMobileIcon}
              placeholder="شماره همراه شما"
              validationSchema={{
                required: "شماره تلفن الزامی است",
                pattern: {
                  value: /^09\d{9}$/,
                  message: "شماره موبایل نامعتبر است",
                },
              }}
            />
            {isPasswordType === true && (
              <PassInput
                RHForm
                isRequired
                name="password"
                errors={errors}
                register={register}
                validationSchema={{
                  required: "رمز عبور الزامی است",
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: "فقط حروف انگلیسی و عدد مجاز است",
                  },
                  minLength: {
                    value: 6,
                    message: "رمز عبور باید حداقل ۶ کاراکتر باشد",
                  },
                }}
                className="  w-full"
                placeholder="رمز عبور"
              />
            )}
          </LoginForm>
        );

      case 2:
        return (
          <LoginForm
            isPasswordType={isPasswordType}
            password={watch("password") || ""}
            otp={otp}
            step={step}
            setStep={setStep}
            MoveBack={MoveBack}
            phoneNumber={phoneNumber}
            onClose={() => router.back()}
            onSubmit={submitStep2}
            closeBtn={closeBtn}
            remaining={remaining}
          >
            <div className="flex items-center justify-center gap-2 w-full h-12 my-4">
              <PersianOTPInput value={otp} onChange={setOtp} numInputs={5} />
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
