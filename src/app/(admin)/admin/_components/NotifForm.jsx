"use client";

import { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import { useSendNotification } from "@/hooks/useNotification";
import RHFRadioButton from "@/ui/RHFRadioButton";

const basicInfoData = [
  {
    id: 1,
    label: "عنوان اعلان",
    name: "title",
    placeholder: "به‌روزرسانی سایت",
  },
  {
    id: 2,
    label: "متن اعلان",
    name: "message",
    placeholder: "متن اعلان را وارد کنید...",
  },
];

const notificationType = [
  {
    id: 1,
    label: "اعلان سیستمی",
    value: "SYSTEM",
  },
  {
    id: 2,
    label: "تخفیف",
    value: "DISCOUNT",
  },
  {
    id: 3,
    label: "کمپین",
    value: "CAMPAIGN",
  },
  {
    id: 4,
    label: "شخصی",
    value: "CUSTOM",
  },
];

const notificationChannels = [
  { id: 1, label: "داخل سایت", value: "IN_APP" },
  { id: 2, label: "پیامک", value: "SMS" },
  { id: 3, label: "هر دو", value: "BOTH" },
];

const notificationTargets = [
  { id: 1, label: "کاربران دلخواه", value: "USER" },
  { id: 2, label: "همه کاربران", value: "ALL" },
];

function NotifForm({ notifToEdit }) {
  const router = useRouter();

  //   const { id, title, value, description } = notifToEdit || {};

  //   const { isDeleting,removeNotification } = useDeleteNotification();

  //   const removeNotifHandler = async (notif) => {
  //     const { id } = notif;
  //     await removeNotification(id);
  //     router.back();
  //   };

  const { isSending, sendNotification } = useSendNotification();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      message: "",
      type: "SYSTEM",
      channel: "IN_APP",
      target: "ALL",
      userIds: "",
    },
  });

  const target = watch("target");

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      message: data.message,
      type: data.type,
      channel: data.channel,
      target: data.target,
    };

    if (data.target === "USER") {
      payload.userIds = data.userIds
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(Boolean);
    }

    await sendNotification(payload);

    // if (!notifToEdit) {
    //   await sendNotification(payload);
    // } else {
    //   await editBrand(payload);
    // }

    router.back();
  };

  return (
    <div className="max-w-6xl p-6">
      <Toaster />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {basicInfoData.map((item) => (
            <RHFTextField
              key={item.name}
              register={register}
              isRequired
              label={item.label}
              name={item.name}
              textClassName="font-bold"
              className="rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder={`مثال: ${item.placeholder}`}
              isPrimary
            />
          ))}
        </div>

        <div className="flex flex-col items-start justify-center gap-8">
          <RadioButtn
            data={notificationType}
            register={register}
            watch={watch}
            label="نوع اعلان"
            name="type"
            requiredMessage="انتخاب نوع الزامی است"
          />
          <RadioButtn
            data={notificationChannels}
            register={register}
            watch={watch}
            label="کانال ارسال"
            name="channel"
            requiredMessage="کانال ارسال الزامی است"
          />
          <RadioButtn
            data={notificationTargets}
            register={register}
            watch={watch}
            label="گیرنده اعلان"
            name="target"
            requiredMessage="انتخاب گیرنده الزامی است"
          />
        </div>

        {target === "USER" && (
          <RHFTextField
            register={register}
            label="شناسه کاربران"
            name="userIds"
            placeholder="مثلاً 1,5,12"
            textClassName="font-bold"
            className="rounded-xl w-full"
            isPrimary
          />
        )}

        {/* Submit Button */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              type="submit"
              disabled={isSending}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isSending ? "در حال ارسال..." : "ارسال اعلان"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>

          {/* {notifToEdit && (
            <button
              type="submit"
              disabled={isDeleting}
              onClick={() => removeNotifHandler(notifToEdit)}
              className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isDeleting ? "در حال حذف..." : "حذف برند"}
            </button>
          )} */}
        </div>
      </form>
    </div>
  );
}

export default NotifForm;

function RadioButtn({ data, register, watch, name, label, requiredMessage }) {
  return (
    <div>
      <h3 className="font-bold mb-2 text-stroke-800 max-md:text-base text-lg">
        {label}
        <span className="text-error">*</span>
      </h3>
      <div className="flex flex-wrap gap-4">
        {data.map((item) => {
          const isChecked = watch(name) === item.value;

          return (
            <RHFRadioButton
              key={item.id}
              name={name}
              value={item.value}
              register={register}
              checked={isChecked}
              validationSchema={{
                required: { requiredMessage },
              }}
            >
              <div
                className={`flex items-center justify-center ${isChecked ? "font-bold border-2 bg-primary/10 text-primary border-primary" : "text-stroke-500 border border-stroke-500"} px-4 py-1 h-10 lg:h-12 rounded-full duration-200`}
              >
                {item.label}
              </div>
            </RHFRadioButton>
          );
        })}
      </div>
    </div>
  );
}
