"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import LoginField from "@/ui/LoginField";

const RESEND_TIME = 90;

function Login({ toggleLoginOpen }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [step, setStep] = useState(1);
  const [isEmailType, setIsEmailType] = useState(true); // 'email' or 'phone'
  const [time, setTime] = useState(RESEND_TIME);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const toggleLoginType = () => {
    setIsEmailType((prevState) => !prevState);
  };

  const PhoneNumberHandler = (e) => {
    setPhoneNumber(e.target.value);
  };

  const OTPHandler = (e) => {
    setOtp(e.target.value);
  };

  const EmailHandler = (e) => {
    setEmail(e.target.value);
  };

  const SendOTPFormHandler = async (e) => {
    e.preventDefault();
    if (step === 1 && phoneNumber.length === 11) {
      setStep(2);
    }
  };

  const PasswordHandler = async (e) => {
    if (step === 1 && email.length >= 11) {
      setStep(2);
    }
    if (step === 2) {
      setPassword(e.target.value);
    }
  };

  const CheckOTPFormHandler = async (e) => {
    e.preventDefault();
    if (step === 2 && otp.length === 5) {
      toggleLoginOpen();
      setPhoneNumber("");
      setOtp("");
      setStep(1);
    }
  };

  const CheckPasswordHandler = async (e) => {
    e.preventDefault();
    if (step === 2 && password.length >= 8) {
      toggleLoginOpen();
      setEmail("");
      setPassword("");
      setStep(1);
    }
  };

  //   useEffect(() => {
  //     const timer = time > 0 && setInterval((t) => setTime((t) => t - 1), 1000);
  //     return () => {
  //       if (timer) clearInterval(timer);
  //     };
  //   }, [time]);

  //   return (
  //     <div className="size-full p-6 md:p-10 md:px-14">
  //       <SendOTPForm setStep={setStep} onChange={PhoneNumberHandler} />
  //     </div>

  const renderPhoneSteps = () => {
    switch (step) {
      case 1:
        return (
          <LoginForm
            toggleLoginType={toggleLoginType}
            isEmailType={isEmailType}
            otp={otp}
            step={step}
            setStep={setStep}
            phoneNumber={phoneNumber}
            onSubmit={SendOTPFormHandler}
            toggleLoginOpen={toggleLoginOpen}
            // isGetting={isGetting}
          >
            <LoginField
              isEmailType={isEmailType}
              otp={otp}
              step={step}
              onChange={PhoneNumberHandler}
            />
          </LoginForm>
        );

      case 2:
        return (
          <LoginForm
            isEmailType={isEmailType}
            otp={otp}
            step={step}
            setStep={setStep}
            phoneNumber={phoneNumber}
            onSubmit={CheckOTPFormHandler}
            toggleLoginOpen={toggleLoginOpen}
            // onResendOtp={SendOTPFormHandler}
            // time={time}
            // isChecking={isChecking}
            // onBack={() => setStep(1)}
          >
            <LoginField
              isEmailType={isEmailType}
              otp={otp}
              step={step}
              setOtp={setOtp}
            />
          </LoginForm>
        );

      default:
        return null;
    }
  };

  const renderEmailSteps = () => {
    switch (step) {
      case 1:
        return (
          <LoginForm
            toggleLoginType={toggleLoginType}
            isEmailType={isEmailType}
            otp={password}
            step={step}
            setStep={setStep}
            phoneNumber={email}
            onSubmit={PasswordHandler}
            toggleLoginOpen={toggleLoginOpen}
            // isGetting={isGetting}
          >
            <LoginField
              isEmailType={isEmailType}
              step={step}
              onChange={EmailHandler}
            />
          </LoginForm>
        );

      case 2:
        return (
          <LoginForm
            isEmailType={isEmailType}
            otp={password}
            step={step}
            setStep={setStep}
            phoneNumber={email}
            onSubmit={CheckPasswordHandler}
            toggleLoginOpen={toggleLoginOpen}
            // onResendOtp={SendOTPFormHandler}
            // time={time}
            // isChecking={isChecking}
            // onBack={() => setStep(1)}
          >
            <LoginField
              isEmailType={isEmailType}
              otp={password}
              step={step}
              onChange={PasswordHandler}
            />
          </LoginForm>
        );

      default:
        return null;
    }
  };

  const renderSteps = () => {
    switch (isEmailType) {
      case true:
        return renderEmailSteps();

      case false:
        return renderPhoneSteps();

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
