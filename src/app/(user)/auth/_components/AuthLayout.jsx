"use client";

import { useRouter } from "next/navigation";

function AuthLayout({
  children,
  login,
  isEmailType,
  isPending,
  step,
  toggleLoginType,
  phoneNumberLength,
  OTPLength,
  isAllFieldesSet,
}) {
  const router = useRouter();

  const RouteToTerms = () => {
    router.back();
    setTimeout(() => {
      router.push("/page/terms");
    }, 0);
  };
  return (
    <>
      <div className="flex flex-col items-center justify-between gap-2 md:gap-4">
        <span className="md:text-2xl text-text-primary font-bold">
          به وبسایت <span className="text-primary">عطر جیاواز</span> خوش آمدید!
        </span>
        {login ? (
          <p className="text-xs md:text-sm text-text-secondary">
            برای ورود در سایت {isEmailType ? "ایمیل" : "شماره موبایل"} خود را
            وارد کنید
          </p>
        ) : (
          <p className="text-xs md:text-sm text-text-secondary">
            برای عضویت در سایت اطلاعات خود را وارد کنید
          </p>
        )}
      </div>
      {login && step === 1 && (
        <button
          onClick={toggleLoginType}
          className=" text-xs text-primary font-bold  cursor-pointer"
        >
          وارد شدن با {isEmailType === true ? "شماره موبایل" : "ایمیل"}
        </button>
      )}
      {children}
      <button
        // type="submit"
        disabled={
          login
            ? phoneNumberLength
              ? false
              : true
            : isAllFieldesSet === true
            ? false
            : true
        }
        className=" btn btn--primary w-full h-12 md:h-14 border-0 "
      >
        {login ? (
          isEmailType === false && step === 1 ? (
            " دریافت کد ورود"
          ) : isEmailType === true && step === 1 ? (
            "چک کردن ایمیل"
          ) : (
            "ورود"
          )
        ) : isPending ? (
          <Loading bgColor="white" />
        ) : (
          "تایید اطلاعات"
        )}
      </button>
      <button
        onClick={() => router.replace(`/auth/${login ? "signin" : "login"}`)}
        className={` text-xs text-blue decoration-1 underline underline-offset-[3px] cursor-pointer`}
      >
        {login ? "حساب کاربری ندارید؟" : "حساب کاربری دارید؟"}
      </button>
      <div className="max-md:hidden text-text-primary pt-4">
        <span className="*:text-primary flex items-center justify-center gap-1.5 flex-wrap">
          {login ? "ورود" : "ثبت‌نام"} شما به معنای پذیرش{" "}
          <button onClick={RouteToTerms}> شرایط عطر جیاواز </button> و
          <button onClick={RouteToTerms}> قوانین حریم خصوصی </button> است
        </span>
      </div>
    </>
  );
}

export default AuthLayout;
