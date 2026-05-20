"use client";

import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  ArrowPathRoundedSquareIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function AuthLayout({
  children,
  login,
  isPasswordType,
  step,
  setStep,
  togglePasswordType,
  remaining,
  phoneNumber,
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
      <div className="flex flex-col items-center justify-between gap-2 sm:gap-4 text-center">
        {login && (
          <span className="max-sm:text-lg sm:text-2xl text-stroke-800 font-bold ">
            به وبسایت <span className="text-primary">جیاواز پرفیوم</span> خوش
            آمدید!
          </span>
        )}
        {login &&
          (step === 2 ? (
            <span className="flex items-center justify-center gap-1 text-xs sm:text-sm text-stroke-600">
              کد برای شماره موبایل
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-start justify-center gap-1"
              >
                <p className="text-primary">{toPersianNumbers(phoneNumber)}</p>
                <PencilSquareIcon className="size-4 text-primary" />
              </button>
              فرستاده شد
            </span>
          ) : (
            <p className="text-xs sm:text-sm text-stroke-600">
              برای ورود در سایت شماره موبایل خود را وارد کنید
            </p>
          ))}
        {!login && (
          <p className="text-lg sm:text-xl text-stroke-600">
            لطفا نام و نام خانوادگی خود را وارد کنید
          </p>
        )}
        {step === 2 && (
          <div className="flex items-center justify-center gap-1 text-stroke-800">
            {remaining !== 0 && (
              <>
                <p className={`${remaining ? "text-primary" : ""}`}>
                  {toPersianNumbers(remaining)}
                </p>
                <p>ثانیه تا</p>
              </>
            )}
            <button
              type="button"
              className={`flex items-center justify-center gap-1 ${!remaining && "text-primary underline"}`}
              onClick={() => setStep(1)}
            >
              ارسال مجدد کد
              {!remaining && (
                <ArrowPathRoundedSquareIcon className="size-4 text-primary" />
              )}
            </button>
          </div>
        )}
      </div>
      {login && step === 1 && (
        <button
          type="button"
          onClick={togglePasswordType}
          className=" text-xs text-primary font-bold cursor-pointer"
        >
          وارد شدن با {isPasswordType === true ? "کد یکبار مصرف" : "رمز عبور"}
        </button>
      )}
      {children}
      {login && (
        <div className="max-sm:hidden text-stroke-800 pt-">
          <span className="*:text-primary flex items-center justify-center gap-1.5 flex-wrap">
            ورود شما به معنای پذیرش
            <button onClick={RouteToTerms} type="button">
              شرایط جیاواز پرفیوم
            </button>
            و
            <button onClick={RouteToTerms} type="button">
              قوانین حریم خصوصی
            </button>
            است
          </span>
        </div>
      )}
    </>
  );
}

export default AuthLayout;
