import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AuthLayout from "./AuthLayout";

function LoginForm({
  togglePasswordType,
  isPasswordType,
  onClose,
  phoneNumber,
  MoveBack,
  step,
  setStep,
  children,
  otp,
  password,
  onSubmit,
  closeBtn,
  remaining,
}) {
  const phoneNumberLength = phoneNumber.length === 11;
  const passLength = isPasswordType ? password.length >= 6 : otp?.length === 5;

  return (
    <form
      data-scroll
      className="flex flex-col items-center justify-between gap-4 size-full"
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
      {step === 2 && (
        <button
          type="button"
          className="absolute max-md:right-6 md:right-6 max-md:top-6 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl md:border-[1.5px] border-stroke-200 md:size-10 md:rounded-full md:p-0  duration-200"
          onClick={MoveBack}
        >
          <ArrowRightIcon className="size-5 text-stroke-800" />
        </button>
      )}
      <AuthLayout
        isPasswordType={isPasswordType}
        step={step}
        setStep={setStep}
        togglePasswordType={togglePasswordType}
        passLength={passLength}
        phoneNumber={phoneNumber}
        login
        remaining={remaining}
      >
        <div className="flex flex-col items-center justify-center gap-4 size-full">
          {children}
          <button
            type="submit"
            disabled={
              isPasswordType
                ? !phoneNumberLength || !passLength
                : !phoneNumberLength
            }
            className=" btn btn--primary w-full px-3 py-2 h-12 md:h-14 border-0 "
          >
            {isPasswordType === false && step === 1 ? "دریافت کد ورود" : "ورود"}
          </button>
        </div>
      </AuthLayout>
    </form>
  );
}

export default LoginForm;
