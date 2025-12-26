"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import LoginField from "@/ui/LoginField";
import { loginApi } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useGetAllUsers } from "@/hooks/useUsers";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import OTPInput from "react-otp-input";
import PassInput from "@/ui/PassInput";
import { useForm } from "react-hook-form";

const RESEND_TIME = 90;

function Login({ toggleModalOpen, closeBtn }) {
  const [phoneNumber, setPhoneNumber] = useState(""); //?
  const [email, setEmail] = useState(""); //?
  const [password, setPassword] = useState(""); //?
  const [otp, setOtp] = useState(""); //?

  const [step, setStep] = useState(1);
  const [isEmailType, setIsEmailType] = useState(true); // 'email' or 'phone'
  const [time, setTime] = useState(RESEND_TIME);
  const router = useRouter();
  const { isLoading, data } = useGetAllUsers();

  const {
    data: loginData,
    isPending: isChecking,
    mutateAsync: loginApifn,
    error: loginError,
  } = useMutation({
    mutationFn: loginApi,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const setState = (e) => {
    const value = e.target.value;
    if (isEmailType) {
      setEmail(value);
    } else {
      setPhoneNumber(value);
    }
  };

  const toggleLoginType = () => {
    setIsEmailType((prevState) => !prevState);
  };

  const PasswordHandler = async (e) => {
    if (e.email) {
      const { email } = e;
      if (step === 1 && email.length >= 11) {
        const isEmailExist = data?.data.find((user) => user.email === email);
        setEmail(email);
        if (isEmailExist?.email === email) {
          setStep(2);
        } else {
          toast.error("ایمیل وارد شده وجود ندارد");
          setEmail("");
        }
      }
    } else {
      const { phoneNumber } = e;
      if (step === 1 && phoneNumber.length >= 11) {
        const isPhoneNumberExist = data?.data.find(
          (user) => user.phoneNumber === phoneNumber
        );
        setPhoneNumber(phoneNumber);
        if (isPhoneNumberExist[0] === true) {
          setStep(2);
        } else {
          toast.error("شماره موبایل وارد شده وجود ندارد");
          setPhoneNumber("");
        }
      }
    }
  };
  // console.log(email, phoneNumber);

  const handleSubmitForm = async (e) => {
    console.log(e);
    if (e.email) {
      const { password } = e;
      if (password.length >= 6) {
        setPassword(password);
        const userData = {
          email,
          password,
        };
        try {
          const { token } = await loginApifn(userData);
          if (token && step === 2 && password.length >= 6) {
            router.back();
            setEmail("");
            setPassword("");
            setStep(1);
            toast.success("به جیاواز خوش آمدید!");
          }
        } catch (error) {
          toast.error(
            loginError?.response?.data?.message ||
              "خطا در ورود به سایت ، لطفا مجددا تلاش کنید"
          );
        }
      }
    } else {
      const { otp } = e;
      if (otp.length === 6) {
        setOtp(otp);
        const userData = {
          phoneNumber,
          otp,
        };
        try {
          const { token } = await loginApifn(userData);
          if (token && step === 2 && otp.length >= 6) {
            router.back();
            setPhoneNumber("");
            setOtp("");
            setStep(1);
            toast.success("به جیاواز خوش آمدید!");
          }
        } catch (error) {
          toast.error(
            loginError?.response?.data?.message ||
              "خطا در ورود به سایت ، لطفا مجددا تلاش کنید"
          );
        }
      }
    }
  };

  const MoveBack = () => {
    setStep(1);
    setEmail("");
    setPassword("");
  };

  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <LoginForm
            toggleLoginType={toggleLoginType}
            isEmailType={isEmailType}
            password={password}
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
            <LoginField
              step={step}
              register={register}
              isRequired
              isEmailType={isEmailType}
              errors={errors}
              email={email}
              phoneNumber={phoneNumber}
              onChange={setState}
            />
          </LoginForm>
        );

      case 2:
        return (
          <LoginForm
            isEmailType={isEmailType}
            password={password}
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
                  inputStyle="flex items-center justify-center pl-4 md:pl-5.5 pt-1 max-md:size-11 md:size-14 bg-[#F1F1F1] rounded-full outline-0 text-text-primary max-md:text-lg md:text-xl duration-200"
                  containerStyle="flex max-md:gap-1 md:gap-2 items-center justify-center w-full focus-within:*:[input]:bg-white focus-within:*:[input]:border focus-within:*:border-primary duration-200"
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
                  className="textField__input textField__authInput w-full"
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
