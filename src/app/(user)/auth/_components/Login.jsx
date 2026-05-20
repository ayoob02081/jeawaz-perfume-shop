"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import OTPInput from "react-otp-input";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import LoginForm from "./LoginForm";
import { requestOtpApi, verifyOtpApi } from "@/services/authServices";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import useOtpTimer from "@/hooks/useOtpTimer";

function Login({ closeBtn }) {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [otp, setOtp] = useState(""); //?
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

      if (phoneNumber) {
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
            <RHFLoginField
              step={step}
              register={register}
              isRequired
              errors={errors}
              phoneNumber={phoneNumber}
              validationSchema={{
                required: "شماره تلفن الزامی است",
                pattern: /^[0-9]{11}$/,
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
                className="textField__input textField__input--2 w-full"
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
              <OTPInput
                dir="ltr"
                inputType="tel"
                value={otp}
                onChange={setOtp}
                numInputs={5}
                renderSeparator={<span> </span>}
                inputStyle="flex items-center justify-center pl-4 sm:pl-5.5 pt-1 max-sm:size-11 sm:size-14 bg-[#F1F1F1] rounded-full outline-0 text-stroke-800 max-sm:text-lg sm:text-xl duration-200"
                containerStyle="flex max-sm:gap-1 sm:gap-2 items-center justify-center w-full focus-within:*:[input]:bg-stroke-0 focus-within:*:[input]:border focus-within:*:border-primary duration-200"
                renderInput={(props) => <input {...props} />}
                skipDefaultStyles
              />
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

function RHFLoginField({
  phoneNumber,
  register,
  errors,
  isRequired,
  validationSchema,
  ...rest
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-2 w-full h-12 md:h-14 ">
      {errors && errors["phoneNumber"] && (
        <span className="absolute -translate-y-1 left-2 text-error block text-xs mt-2">
          {errors["phoneNumber"]?.message}
        </span>
      )}
      <div className="flex items-center justify-center gap-2 size-full px-5 py-2 rounded-5xl bg-stroke-100  text-stroke-600 focus-within:*:text-stroke-800  focus-within:bg-stroke-0 focus-within:border border-primary">
        <DevicePhoneMobileIcon className="size-5" />
        <input
          className="outline-0 size-full"
          dir="rtl"
          type="tel"
          id="phoneNumber"
          placeholder="شماره همراه شما"
          {...register("phoneNumber", validationSchema)}
          {...rest}
        />
      </div>
    </div>
  );
}
