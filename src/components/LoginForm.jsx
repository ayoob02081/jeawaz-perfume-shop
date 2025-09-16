import { toPersianNumbers } from "@/utils/toPersianNumbers";
import ImageFrame from "./ImageFrame";

function LoginForm({
  phoneNumber,
  setStep,
  onSubmit,
  step,
  children,
  toggleLoginOpen,
  otp,
}) {
  const phoneNumberLength = phoneNumber.length === 11;
  const OTPLength = otp.length === 5;

  return (
    <div className="flex flex-col items-center justify-between md:gap-4 size-full">
      <button
        className="absolute md:left-6 max-md:top-3 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl max-md:bg-[#F1F1F1]  md:border-[1.5px] border-stroke md:size-10 rounded-full md:p-0"
        onClick={toggleLoginOpen}
      >
        <ImageFrame
          src="/images/close-simple-icon.svg"
          alt="close icon"
          className="size-3.5 max-md:hidden"
        />
      </button>
      <div className="flex flex-col items-stretch justify-between gap-6 md:gap-8 max-md:mt-4 w-full">
        {step === 1 && (
          <div className="flex flex-col items-center justify-between gap-2 md:gap-4">
            <span className="md:text-2xl text-text-primary font-bold">
              به وبسایت <span className="text-primary">عطر جیاواز</span> خوش
              آمدید!
            </span>
            <p className="text-xs md:text-sm text-text-secondary">
              برای ورود و عضویت در سایت شماره موبایل خود را وارد کنید
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center justify-between gap-2 md:gap-4">
            <span className="md:text-2xl text-text-primary font-bold">
              دریافت کد ورود
            </span>
            <p className="text-xs md:text-sm text-text-secondary">
              کد 5 رقمی ارسال شده به شماره {toPersianNumbers(phoneNumber)} در
              قسمت زیر وارد نمایید
            </p>
          </div>
        )}
        {children}
      </div>
      <button
        onClick={onSubmit}
        type="submit"
        className={` ${
          (step === 1 && phoneNumberLength) || (step === 2 && OTPLength)
            ? "bg-primary"
            : "bg-primary/50 "
        } btn btn-primary w-full h-12 border-0  `}
      >
        {step === 1 ? " دریافت کد ورود" : "ورود"}
      </button>
      <div className="max-md:hidden text-text-primary">
        <span className="*:text-primary flex items-center justify-center gap-1.5 flex-wrap">
          ورود شما به معنای پذیرش <p> شرایط عطر جیاواز </p> و
          <p> قوانین حریم خصوصی </p> است
        </span>
      </div>
    </div>
  );
}

export default LoginForm;
