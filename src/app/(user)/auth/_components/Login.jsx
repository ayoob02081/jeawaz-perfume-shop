"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import LoginField from "@/ui/LoginField";
import { loginApi } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useGetAllUsers } from "@/hooks/useUsers";

const RESEND_TIME = 90;

function Login({ toggleLoginOpen, setName, name }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [step, setStep] = useState(1);
  const [isEmailType, setIsEmailType] = useState(true); // 'email' or 'phone'
  const [time, setTime] = useState(RESEND_TIME);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { isLoading, data } = useGetAllUsers();

  const isEmailExist = data?.data.find((user) => user.email === email);

  const isPhoneNumberExist = data?.data.find(
    (user) => user.phoneNumber === phoneNumber
  );

  const {
    data: loginData,
    isPending: isChecking,
    mutateAsync: loginApifn,
  } = useMutation({
    mutationFn: loginApi,
  });


  const toggleLoginType = () => {
    setIsEmailType((prevState) => !prevState);
  };

  const PhoneNumberHandler = (e) => {
    setPhoneNumber(e.target.value);
  };

  // const OTPHandler = (e) => {
  //   setOtp(e.target.value);
  // };

  const EmailHandler = (e) => {
    setEmail(e.target.value);
  };

  const SendOTPFormHandler = async (e) => {
    e.preventDefault();
    if (step === 1 && phoneNumber.length === 11) {
      if (isPhoneNumberExist[0] === true) {
        setStep(2);
      } else {
        toast.error("شماره موبایل وارد شده وجود ندارد");
        setPhoneNumber("");
      }
    }
  };

  const PasswordHandler = async (e) => {
    e.preventDefault();
    if (step === 1 && email.length >= 11) {
      if (isEmailExist?.email === email) {
        setStep(2);
      } else {
        toast.error("ایمیل وارد شده وجود ندارد");
        setEmail("");
      }
    }
    if (step === 2) {
      setPassword(e.target.value);
    }
  };

  const CheckOTPFormHandler = async (e) => {
    e.preventDefault();
    try {
      // const { token } = await loginApifn({ email, password });
      if (step === 2 && otp.length === 5) {
        router.back();
        setPhoneNumber("");
        setOtp("");
        setStep(1);
        toast.success("به جیاواز خوش آمدید!");
      }
    } catch (error) {
      toast.error("خطا در ورود به سایت ، لطفا مجددا تلاش کنید");
      console.log(error);
    }
  };

  const CheckPasswordHandler = async (e) => {
    e.preventDefault();
    try {
      const { token } = await loginApifn({ email, password });
      if (token && step === 2 && password.length >= 6) {
        router.back();
        setEmail("");
        setPassword("");
        setStep(1);
        toast.success("به جیاواز خوش آمدید!");
      }
    } catch (error) {
      toast.error("خطا در ورود به سایت ، لطفا مجددا تلاش کنید");
      console.log(error);
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
            onSubmit={isEmailExist ? PasswordHandler : SendOTPFormHandler}
            toggleLoginOpen={toggleLoginOpen}
            // isGetting={isGetting}
          >
            <LoginField
              email={email}
              isEmailType={isEmailType}
              step={step}
              onChange={isEmailType ? EmailHandler : PhoneNumberHandler}
              otp={otp}
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
            onSubmit={isEmailType ? CheckPasswordHandler : CheckOTPFormHandler}
            toggleLoginOpen={toggleLoginOpen}
            // onResendOtp={SendOTPFormHandler}
            // time={time}
            // isChecking={isChecking}
          >
            <LoginField
              isEmailType={isEmailType}
              otp={otp}
              step={step}
              onChange={PasswordHandler}
              setOtp={setOtp}
            />
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
