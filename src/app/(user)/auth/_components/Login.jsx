"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/auth/AuthContext";
import LoginForm from "./LoginForm";
import { requestOtpApi, verifyOtpApi } from "@/services/authServices";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import useOtpTimer from "@/hooks/useOtpTimer";
import RHFTextField from "@/ui/RHFTextField";
import PersianOTPInput from "@/ui/PersianOTPInput";
import useWebOtp from "@/hooks/useWebOtp";
import {
  createOtpVerificationGuard,
  isCompleteOtp,
} from "@/utils/otpInputContract.mjs";

function Login({ closeBtn }) {
  const {
    register,
    control,
    watch,
    reset,
    getValues,
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

  // One OTP verification at a time (manual submit, Enter, WebOTP).
  const verificationGuardRef = useRef(null);
  if (!verificationGuardRef.current) {
    verificationGuardRef.current = createOtpVerificationGuard();
  }

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

  // Verifies the given code, not the `otp` state, so a code that was just set
  // (WebOTP) is used before React re-renders.
  const verifyOtp = async (code) => {
    const result = await verificationGuardRef.current.run(async () => {
      await verifyOtpApi({ phoneNumber: getValues("phoneNumber"), code });
      await checkAuth();
    });

    if (result.skipped) return;
    if (!result.ok) return toast.error("ورود ناموفق بود، دوباره تلاش کنید");

    toast.success("به جیاواز خوش آمدید!");
    router.back();
  };

  useWebOtp({
    enabled: step === 2 && !isPasswordType,
    onCode: (code) => {
      setOtp(code);
      verifyOtp(code);
    },
  });

  const handleSubmitForm = async (e) => {
    const { password, phoneNumber } = e;

    if (!isPasswordType) {
      if (!isCompleteOtp(otp)) return toast.error("کد تکمیل نشده");
      return verifyOtp(otp);
    }

    try {
      if (password.length < 6) return toast.error("رمز عبور کوتاه است");

      await login({ phoneNumber, password });

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
                  message: "شماره موبایل باید با ۰۹ شروع شود",
                },
                minLength: {
                  value: 11,
                  message: "شماره همراه باید ۱۱ کاراکتر باشد",
                },
                maxLength: {
                  value: 11,
                  message: "شماره همراه باید ۱۱ کاراکتر باشد",
                },
              }}
              isPrimary
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
                className="w-full"
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
    <div className="relative size-full max-[30rem]:px-4 sm:py-10 p-6 md:px-14">
      {renderSteps()}
    </div>
  );
}

export default Login;
