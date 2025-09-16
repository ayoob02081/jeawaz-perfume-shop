import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import React from "react";
import OTPInput from "react-otp-input";

function LoginField({ onChange, step, setOtp, otp }) {
  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex items-center justify-center gap-2 size-full px-5 py-1.5 rounded-[40px] bg-[#F1F1F1] text-text-secondary focus-within:*:text-text-primary  focus-within:bg-white  focus-within:border border-primary">
            <DevicePhoneMobileIcon className="size-5" />
            <input
              className="outline-0 size-full"
              dir="rtl"
              type="tel"
              id="phoneNumber"
              pattern="[0-9]{4}-[0-9]{3}-[0-9]{4}"
              maxLength={11}
              minLength={11}
              placeholder="شماره همراه شما"
              onChange={onChange}
            />
          </div>
        );

      case 2:
        return (
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 w-full h-12 ">
      {renderSteps()}
    </div>
  );
}

export default LoginField;
