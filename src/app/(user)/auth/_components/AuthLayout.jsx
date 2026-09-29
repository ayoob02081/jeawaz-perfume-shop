"use client";

import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  ArrowPathRoundedSquareIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

// Code-step heading around the phone button, per code screen status.
const OTP_HEADINGS = {
  sending: ["در حال ارسال کد به", "..."],
  resending: ["در حال ارسال کد جدید به", "..."],
  ready: ["کد برای شماره موبایل", "فرستاده شد"],
  "send-error": ["ارسال کد به", "انجام نشد"],
};

function AuthLayout({
  children,
  login,
  isPasswordType,
  step,
  togglePasswordType,
  phoneNumber,
  otpScreen,
  requestError,
  onEditPhone,
  onResend,
  onRetry,
  editDisabled = false,
  resendRemaining = 0,
  resendPending = false,
  actionsDisabled = false,
}) {
  const router = useRouter();
  const canResend = resendRemaining === 0 && !actionsDisabled;
  // The code is claimed as sent only once the backend confirmed it.
  const [otpHeadingStart, otpHeadingEnd] =
    OTP_HEADINGS[otpScreen] ?? OTP_HEADINGS.ready;

  const RouteToTerms = () => {
    router.back();
    setTimeout(() => {
      router.push("/page/terms");
    }, 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:gap-4 text-center">
        {login && (
          <span className="max-sm:text-lg sm:text-2xl text-stroke-800 font-bold ">
            به وبسایت <span className="text-primary">جیاواز پرفیوم</span> خوش
            آمدید!
          </span>
        )}
        {login &&
          (step === "otp" ? (
            <span
              aria-live="polite"
              className="flex items-center justify-center gap-1 text-xs sm:text-sm text-stroke-600"
            >
              {otpHeadingStart}
              <button
                type="button"
                onClick={onEditPhone}
                disabled={editDisabled}
                className="flex items-start justify-center gap-1"
              >
                <p className="text-primary">{toPersianNumbers(phoneNumber)}</p>
                <PencilSquareIcon className="size-4 text-primary" />
              </button>
              {otpHeadingEnd}
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
        {step === "otp" && otpScreen === "send-error" && (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-2"
          >
            {requestError && (
              <p className="text-error text-xs sm:text-sm">{requestError}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-primary">
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center justify-center gap-1 underline"
              >
                تلاش مجدد
                <ArrowPathRoundedSquareIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={onEditPhone}
                disabled={editDisabled}
                className="flex items-center justify-center gap-1 underline"
              >
                ویرایش شماره
                <PencilSquareIcon className="size-4" />
              </button>
            </div>
          </div>
        )}
        {step === "otp" &&
          (otpScreen === "ready" || otpScreen === "resending") && (
          <div className="flex items-center justify-center gap-1 text-stroke-800">
            {resendRemaining > 0 && (
              <>
                <p className="text-primary">
                  {toPersianNumbers(resendRemaining)}
                </p>
                <p>ثانیه تا</p>
              </>
            )}
            <button
              type="button"
              className={`flex items-center justify-center gap-1 ${canResend ? "text-primary underline" : ""}`}
              onClick={onResend}
              disabled={!canResend}
              aria-busy={resendPending}
            >
              {resendPending ? "در حال ارسال کد..." : "ارسال مجدد کد"}
              {canResend && (
                <ArrowPathRoundedSquareIcon className="size-4 text-primary" />
              )}
            </button>
          </div>
        )}
      </div>
      {/* {login && step === 1 && (
        <button
          type="button"
          onClick={togglePasswordType}
          className=" text-xs text-primary font-bold cursor-pointer"
        >
          وارد شدن با {isPasswordType === true ? "کد یکبار مصرف" : "رمز عبور"}
        </button>
      )} */}
      {children}
      {login && (
        <div className="text-stroke-800">
          <span className="*:text-primary flex items-center justify-center gap-1.5 flex-wrap text-wrap">
            ورود شما به معنای پذیرش
            <button onClick={RouteToTerms} type="button" >
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
    </div>
  );
}

export default AuthLayout;
