"use client";

import { useCreateContactMessage } from "@/hooks/useContactMessages";
import RHFTextAreaField from "@/ui/RHFTextAreaField";
import RHFTextField from "@/ui/RHFTextField";
import {
  contactFormDefaultValues,
  contactFormRules,
  createContactSubmitter,
} from "@/utils/contactFormContract.mjs";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

export default function ContactUsForm() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: contactFormDefaultValues });

  const { isSending, createContactMessage } = useCreateContactMessage();

  // Ignores repeated submits while one is in flight; keeps values on failure.
  const submitContactForm = useMemo(
    () => createContactSubmitter({ send: createContactMessage, reset }),
    [createContactMessage, reset],
  );

  const isBusy = isSubmitting || isSending;

  const textFieldData = [
    {
      id: 1,
      label: "نام و نام خانوادگی",
      name: "fullName",
      placeholder: "علی حسنی",
      type: "text",
    },
    {
      id: 2,
      label: "شماره همراه",
      name: "phoneNumber",
      placeholder: "۰۹۱۲۳۴۵۶۷۸۹",
      type: "tel",
    },
  ];

  return (
    <>
      <form
        method="post"
        noValidate
        onSubmit={handleSubmit(submitContactForm)}
        className="flex flex-col items-start justify-between gap-6 p-6 border border-stroke-250 rounded-2xl size-full"
      >
        <h3 className="font-bold text-stroke-800 text-xl">
          ارسال پیام یا سوال
        </h3>
        <div className="flex flex-col items-center justify-between gap-6 size-full">
          {textFieldData.map((item) => (
            <RHFTextField
              key={item.name}
              register={register}
              control={control}
              errors={errors}
              // isRequired
              type={item.type}
              label={item.label}
              name={item.name}
              textClassName="text-sm!"
              validationSchema={contactFormRules[item.name]}
              placeholder={`مثال: ${item.placeholder}`}
              isPrimary
            />
          ))}
          <RHFTextAreaField
            name="message"
            //   isRequired
            label="پیام شما"
            register={register}
            errors={errors}
            placeholder="پیام خود را بنویسید ..."
            validationSchema={contactFormRules.message}
            className="rounded-xl h-32"
            isPrimary
          />
        </div>
        {/* Honeypot: invisible, unfocusable and hidden from assistive tech. */}
        <div aria-hidden="true" className="sr-only">
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>
        <button
          type="submit"
          disabled={isBusy}
          aria-busy={isBusy}
          className="btn btn--primary px-8 py-2 font-bold rounded-xl text-base disabled:opacity-50 max-lg:w-full"
        >
          {isBusy ? "در حال ارسال..." : "ارسال پیام"}
        </button>
      </form>
    </>
  );
}
