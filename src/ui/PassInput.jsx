"use client";

import { useState } from "react";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function PassInput({
  label,
  placeholder,
  isRequired,
  onChange,
  RHForm,
  register,
  name,
  validationSchema = {},
  className,
  errors,
  dir = "rtl",
  ...rest
}) {
  const errorMessages = errors?.[name];
  const hasError = !!(errors && errorMessages);

  const [passwordVisible, setPasswordVisible] = useState("password");
  const ShowPasswordHandler = () => {
    setPasswordVisible((prev) => (prev === "password" ? "text" : "password"));
  };

  return RHForm ? (
    <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
      <label htmlFor={name} className="text-text mb-4">
        {label}
        {isRequired && <span className="text-error">*</span>}
      </label>
      <div
        className={`flex items-center justify-between gap-2 size-full px-3 py-2 rounded-5xl bg-[#f1f1f1] focus-within:*:text-text-primary  focus-within:bg-white focus-within:border-[1.5px] border-primary`}
      >
        <input
          className={`outline-0 size-full ${
            dir === "ltr" ? "text-left" : "text-right"
          }`}
          dir="rtl"
          type={passwordVisible}
          id={name}
          minLength={6}
          placeholder={placeholder}
          {...register(name, validationSchema)}
          {...rest}
        />
        <button onClick={ShowPasswordHandler}>
          {passwordVisible === "password" ? (
            <EyeSlashIcon className=" size-5" />
          ) : (
            <EyeIcon className=" size-5" />
          )}
        </button>
      </div>
      {errors && errors[name] && (
        <span className="text-error block text-xs mt-2">
          {errors[name]?.message}
        </span>
      )}
    </div>
  ) : (
    <div
      className={`flex items-center justify-center gap-2 size-full px-5 py-1.5 rounded-5xl ${className} text-text-secondary focus-within:*:text-text-primary  focus-within:bg-white focus-within:border border-primary`}
    >
      <input
        className="outline-0 size-full"
        dir="rtl"
        type={passwordVisible}
        id="password"
        minLength={6}
        placeholder={placeholder}
        onChange={onChange}
      />
      <button onClick={ShowPasswordHandler}>
        {passwordVisible === "password" ? (
          <EyeSlashIcon className=" size-5" />
        ) : (
          <EyeIcon className=" size-5" />
        )}
      </button>
    </div>
  );
}

export default PassInput;
