"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import LoginField from "@/ui/LoginField";

const RESEND_TIME = 90;

function Login({ toggleLoginOpen }) {
  const [phoneNumber, setPhoneNumber] = useState("");

  const [step, setStep] = useState(1);
  const [time, setTime] = useState(RESEND_TIME);
  const [otp, setOtp] = useState("");
  const PhoneNumberHandler = (e) => {
    setPhoneNumber(e.target.value);
  };
  const SendOTPFormHandler = async (e) => {
    setStep(2);
  };
  const CheckOTPFormHandler = async (e) => {
    toggleLoginOpen();
    setStep(1);
    setOtp("");
    setPhoneNumber("");
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

  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <LoginForm
            otp={otp}
            step={step}
            setStep={setStep}
            phoneNumber={phoneNumber}
            onSubmit={SendOTPFormHandler}
            toggleLoginOpen={toggleLoginOpen}
            // isGetting={isGetting}
          >
            <LoginField
              otp={otp}
              step={step}
              setOtp={setOtp}
              onChange={PhoneNumberHandler}
            />
          </LoginForm>
        );

      case 2:
        return (
          <LoginForm
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
              otp={otp}
              step={step}
              setOtp={setOtp}
              onChange={PhoneNumberHandler}
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
