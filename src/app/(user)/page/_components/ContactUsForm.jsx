"use client";

import RHFTextAreaField from "@/ui/RHFTextAreaField";
import RHFTextField from "@/ui/RHFTextField";
import { useForm } from "react-hook-form";
import { Toaster } from "react-hot-toast";

export default function ContactUsForm() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm({});

  const textFieldData = [
    {
      id: 1,
      label: "نام و نام خانوادگی",
      name: "fullNmae",
      placeholder: "علی حسنی",
      type: "text",
    },
    {
      id: 2,
      label: "شماره همراه",
      name: "value",
      placeholder: "۰۹۱۲۳۴۵۶۷۸۹",
      type: "number",
    },
  ];

  return (
    <>
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-start justify-between gap-2 p-6 border border-stroke-250 rounded-2xl size-full"
      >
        <h3 className="font-bold text-stroke-800 text-xl pb-6">
          ارسال پیام یا سوال
        </h3>
        <div className="flex flex-col items-center justify-between gap-6 size-full">
          {textFieldData.map((item) => (
            <RHFTextField
              key={item.name}
              register={register}
              // isRequired
              type={item.type}
              label={item.label}
              name={item.name}
              textClassName="!text-sm"
              className="textField__input textField__input--2 rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder={`مثال: ${item.placeholder}`}
            />
          ))}
          <RHFTextAreaField
            name="description"
            //   isRequired
            label="پیام شما"
            register={register}
            placeholder="پیام خود را بنویسید ..."
            validationSchema={{ required: true }}
            className="textField__input textField__input--2 rounded-xl w-full h-32"
          />
        </div>
        <button className="btn btn--primary px-8 py-2 font-bold rounded-xl text-base">
          ارسال پیام
        </button>
      </form>
    </>
  );
}
