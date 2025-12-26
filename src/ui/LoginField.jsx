import {
  DevicePhoneMobileIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

function LoginField({
  isEmailType,
  email,
  phoneNumber,
  register,
  errors,
  isRequired,
  onChange,
  ...rest
}) {
  const name = isEmailType ? "email" : "phoneNumber";
  const validationSchema = { required: true };

  return (
    <div className="flex items-center justify-center gap-2 w-full h-12 ">
      <div className="flex items-center justify-center gap-2 size-full px-5 py-1.5 rounded-5xl bg-[#F1F1F1] text-text-secondary focus-within:*:text-text-primary  focus-within:bg-white  focus-within:border border-primary">
        {isEmailType ? (
          <EnvelopeIcon className="size-5" />
        ) : (
          <DevicePhoneMobileIcon className="size-5" />
        )}
        <input
          className="outline-0 size-full text-text"
          dir="rtl"
          type={isEmailType ? "email" : "tel"}
          id={name}
          placeholder={isEmailType ? "ایمیل شما" : "شماره همراه شما"}
          {...register(name, validationSchema)}
          {...rest}
          onChange={onChange}
        />
        {errors && errors[name] && (
          <span className="text-error block text-xs mt-2">
            {errors[name]?.message}
          </span>
        )}
      </div>
    </div>
  );
}

export default LoginField;
