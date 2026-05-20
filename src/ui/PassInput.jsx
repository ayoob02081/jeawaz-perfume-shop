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
  const hasError = errors?.[name];

  const [passwordVisible, setPasswordVisible] = useState("password");
  const ShowPasswordHandler = () => {
    setPasswordVisible((prev) => (prev === "password" ? "text" : "password"));
  };

  return RHForm ? (
    <div className="flex flex-col items-start justify-center space-y-4 text-sm w-full h-12 md:h-14">
      {label && (
        <label htmlFor={name} className="text-stroke-800 mb-4">
          {label}
          {isRequired && <span className="text-error">*</span>}
        </label>
      )}
      <div
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-5xl bg-stroke-100 text-stroke-800  focus-within:bg-stroke-0 focus-within:border-[1.5px] border-primary h-full`}
      >
        <input
          className={`outline-0 size-full ${
            dir === "ltr" ? "text-left" : "text-right"
          }`}
          dir={dir}
          type={passwordVisible}
          id={name}
          placeholder={placeholder}
          {...rest}
          {...register(name, validationSchema)}
        />
        <div onClick={ShowPasswordHandler}>
          {passwordVisible === "password" ? (
            <EyeSlashIcon className=" size-5" />
          ) : (
            <EyeIcon className=" size-5" />
          )}
        </div>
      </div>
      {hasError && (
        <span className="text-error block text-xs mt-2">
          {hasError?.message}
        </span>
      )}
    </div>
  ) : (
    <div
      className={`flex items-center justify-center gap-2 size-full px-5 py-1.5 rounded-5xl ${className} text-stroke-600 focus-within:*:text-stroke-800  focus-within:bg-stroke-0 focus-within:border border-primary`}
    >
      <input
        className="outline-0 size-full"
        dir={dir}
        type={passwordVisible}
        id="password"
        minLength={6}
        placeholder={placeholder}
        onChange={onChange}
      />
      <button type="button" onClick={ShowPasswordHandler}>
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
