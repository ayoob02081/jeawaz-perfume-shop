import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AuthLayout from "./AuthLayout";

function LoginForm({
  togglePasswordType,
  isPasswordType,
  onClose,
  phoneNumber,
  onEditPhone,
  onResend,
  onRetry,
  editDisabled = false,
  otpScreen,
  requestError,
  step,
  children,
  otp,
  password,
  onSubmit,
  closeBtn,
  resendRemaining,
  requestPending = false,
  verifyPending = false,
}) {
  const passLength = isPasswordType ? password.length >= 6 : otp?.length === 5;
  // Disabled only while a request or verification is in flight, and on the
  // code step until a code was confirmed.
  const busy = requestPending || verifyPending;
  const submitDisabled = busy || (step === "otp" && otpScreen !== "ready");

  let submitLabel =
    isPasswordType === false && step === "phone" ? "دریافت کد ورود" : "ورود";
  if (step === "otp" && (otpScreen === "sending" || otpScreen === "resending")) {
    submitLabel = "در حال ارسال کد...";
  }
  if (step === "otp" && verifyPending) submitLabel = "در حال بررسی...";

  return (
    <form
      data-scroll
      className="flex flex-col items-center justify-between gap-4 size-full
   "
      onSubmit={onSubmit}
    >
      {closeBtn && (
        <div className="absolute md:left-6 max-md:top-3 md:top-6 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl max-md:bg-stroke-200">
          <button
            className="btn max-md:border-0 md:border-[1.5px] border-stroke-200 md:size-10 aspect-square rounded-full md:p-0"
            onClick={onClose}
            type="button"
          >
            <XMarkIcon className="max-md:hidden size-5.5 text-stroke-800" />
          </button>
        </div>
      )}
      {step === "otp" && (
        <button
          type="button"
          className="absolute max-md:right-0 md:right-6 max-md:top-4 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl md:border-[1.5px] border-stroke-200 md:size-10 md:rounded-full md:p-0  duration-200"
          onClick={onEditPhone}
          disabled={editDisabled}
        >
          <ArrowRightIcon className="size-5 text-stroke-800" />
        </button>
      )}
      <AuthLayout
        isPasswordType={isPasswordType}
        step={step}
        togglePasswordType={togglePasswordType}
        passLength={passLength}
        phoneNumber={phoneNumber}
        login
        otpScreen={otpScreen}
        requestError={requestError}
        onEditPhone={onEditPhone}
        onResend={onResend}
        onRetry={onRetry}
        editDisabled={editDisabled}
        resendRemaining={resendRemaining}
        resendPending={otpScreen === "resending"}
        actionsDisabled={busy}
      >
        <div className="flex flex-col items-center justify-center gap-4 size-full">
          {children}
          <button
            type="submit"
            disabled={submitDisabled}
            aria-busy={busy}
            className=" btn btn--primary w-full px-3 py-2 h-12 md:h-14 border-0 "
          >
            {submitLabel}
          </button>
        </div>
      </AuthLayout>
    </form>
  );
}

export default LoginForm;
