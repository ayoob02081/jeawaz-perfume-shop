import { toPersianNumbers } from "@/utils/toPersianNumbers";
import ImageFrame from "../../../../components/ImageFrame";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function LoginForm({
  isEmailType,
  toggleLoginType,
  phoneNumber,
  onSubmit,
  MoveBack,
  step,
  email,
  children,
  toggleLoginOpen,
  otp,
  password,
}) {
  const phoneNumberLength = isEmailType
    ? email.length >= 11
    : phoneNumber.length === 11;
  const OTPLength = isEmailType ? password.length >= 6 : otp.length === 5;
  const router = useRouter();
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
      {step === 2 && (
        <button
          className="absolute max-md:right-6 md:right-6 max-md:top-6 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl md:border-[1.5px] border-stroke md:size-10 md:rounded-full md:p-0"
          onClick={MoveBack}
        >
          <ArrowRightIcon className="size-5 text-text" />
        </button>
      )}
      <div className="flex flex-col items-stretch justify-between gap-6 md:gap-8 max-md:mt-4 w-full">
        {step === 1 && (
          <div className="relative flex flex-col items-center justify-between gap-2 md:gap-4">
            <span className="md:text-2xl text-text-primary font-bold">
              به وبسایت <span className="text-primary">عطر جیاواز</span> خوش
              آمدید!
            </span>
            <p className="text-xs md:text-sm text-text-secondary">
              برای ورود در سایت {isEmailType?"ایمیل":"شماره موبایل"} خود را وارد کنید
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center justify-between gap-2 md:gap-4">
            <span className="md:text-2xl text-text-primary font-bold">
              {isEmailType ? "وارد کردن رمز" : " دریافت کد ورود"}
            </span>
            <p className="text-xs md:text-sm text-text-secondary">
              {isEmailType
                ? "لطفا رمز خود را وارد کنید"
                : ` کد 5 رقمی ارسال شده به شماره ${toPersianNumbers(
                    phoneNumber
                  )} در
             قسمت زیر وارد نمایید`}
            </p>
          </div>
        )}
        {children}
        {step === 1 && (
          <button
            onClick={toggleLoginType}
            className="absolute  max-md:bottom-32 md:top-30 text-xs text-primary font-bold  cursor-pointer"
          >
            وارد شدن با {isEmailType === true ? "شماره موبایل" : "ایمیل"}
          </button>
        )}
        {step === 1 && (
          <button
            onClick={() => router.replace("/auth/signin")}
            className="absolute translate-x-1/2 right-1/2 max-md:bottom-26 md:bottom-26 text-xs text-blue decoration-1 underline underline-offset-[3px] cursor-pointer"
          >
            حساب کاربری ندارید؟
          </button>
        )}
      </div>
      <button
        onClick={onSubmit}
        type="submit"
        className={` ${
          (step === 1 && phoneNumberLength) || (step === 2 && OTPLength)
            ? "bg-primary"
            : "bg-primary/50 "
        } btn btn--primary w-full h-12 border-0  `}
      >
        {isEmailType === false && step === 1
          ? " دریافت کد ورود"
          : isEmailType === true && step === 1
          ? "چک کردن ایمیل"
          : "ورود"}
      </button>
      <div className="max-md:hidden text-text-primary pt-4">
        <span className="*:text-primary flex items-center justify-center gap-1.5 flex-wrap">
          ورود شما به معنای پذیرش <p> شرایط عطر جیاواز </p> و
          <p> قوانین حریم خصوصی </p> است
        </span>
      </div>
    </div>
  );
}

export default LoginForm;
