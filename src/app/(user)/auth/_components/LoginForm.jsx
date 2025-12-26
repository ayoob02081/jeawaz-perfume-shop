import { ArrowRightIcon } from "@heroicons/react/24/outline";
import FormModalLayout from "@/components/FormModalLayout";
import AuthLayout from "./AuthLayout";

function LoginForm({
  isEmailType,
  toggleLoginType,
  phoneNumber,
  MoveBack,
  step,
  email,
  children,
  toggleModalOpen,
  otp,
  password,
  handleSubmit,
  closeBtn,
}) {
  const phoneNumberLength = isEmailType
    ? email.length >= 11
    : phoneNumber.length === 11;
  const OTPLength = isEmailType ? password.length >= 6 : otp.length === 5;

  return (
    <FormModalLayout
      onClose={toggleModalOpen}
      handleSubmit={handleSubmit}
      closeBtn={closeBtn}
    >
      {step === 2 && (
        <button
          className="absolute max-md:right-6 md:right-6 max-md:top-6 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl md:border-[1.5px] border-stroke md:size-10 md:rounded-full md:p-0"
          onClick={MoveBack}
        >
          <ArrowRightIcon className="size-5 text-text" />
        </button>
      )}
      <AuthLayout
        isEmailType={isEmailType}
        step={step}
        toggleLoginType={toggleLoginType}
        OTPLength={OTPLength}
        phoneNumberLength={phoneNumberLength}
        login
      >
        {children}
      </AuthLayout>
    </FormModalLayout>
  );
}

export default LoginForm;
