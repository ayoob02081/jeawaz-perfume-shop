"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import { useSendNotification } from "@/hooks/useNotification";
import RHFRadioButton from "@/ui/RHFRadioButton";
import UserPicker, {
  UserSummary,
  userDisplayName,
} from "../../_components/picker/UserPicker";
import SelectedEntityList from "../../_components/picker/SelectedEntityList";
import {
  NOTIFICATION_TARGETS,
  buildNotificationTargetPayload,
  removeFromSelection,
} from "@/utils/entityPickerContract.mjs";
import ActionButtons from "../../_components/ActionButtons";

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
  { id: 1, label: "کاربران منتخب", value: "USER" },
  { id: 2, label: "همه کاربران", value: "ALL" },
];

function NotifForm() {
  const router = useRouter();

  const { isSending, sendNotification } = useSendNotification();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      message: "",
      type: "SYSTEM",
      channel: "IN_APP",
      target: NOTIFICATION_TARGETS.ALL,
      // Snapshots for display; only their IDs are sent.
      selectedUsers: [],
    },
  });

  const target = watch("target");

  const {
    field: usersField,
    fieldState: { error: usersError },
  } = useController({
    name: "selectedUsers",
    control,
    rules: {
      validate: (value, values) =>
        values.target !== NOTIFICATION_TARGETS.USER ||
        value.length > 0 ||
        "حداقل یک کاربر را انتخاب کنید",
    },
  });
  const selectedUsers = usersField.value;

  const onSubmit = (data) => {
    const payload = {
      title: data.title,
      message: data.message,
      type: data.type,
      channel: data.channel,
      // userIds only for USER; ALL omits it.
      ...buildNotificationTargetPayload({
        target: data.target,
        selectedUsers: data.selectedUsers,
      }),
    };

    // mutate does not wait for the server: leave only after a confirmed
    // success; a failed send keeps the form and its selection.
    sendNotification(payload, { onSuccess: () => router.back() });
  };

  return (
    <div className="max-w-6xl p-6 w-full">
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

        {target === NOTIFICATION_TARGETS.USER && (
          <SelectedEntityList
            label="کاربران گیرنده"
            isRequired
            items={selectedUsers}
            entityLabel="کاربر"
            addLabel="انتخاب کاربران"
            emptyText="هنوز کاربری انتخاب نشده است."
            renderItem={(user) => <UserSummary user={user} />}
            getItemName={userDisplayName}
            onOpen={() => setIsPickerOpen(true)}
            onRemove={(userId) =>
              usersField.onChange(removeFromSelection(selectedUsers, userId))
            }
            onClear={() => usersField.onChange([])}
            error={usersError?.message}
          />
        )}

        {/* Action Buttons */}
        <ActionButtons
          confurmLabel={isSending ? "در حال ارسال..." : "ارسال اعلان"}
          isPending={isSending}
        />
      </form>

      {/* Outside the form: nothing in the picker can submit it. */}
      <UserPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        value={selectedUsers}
        onConfirm={usersField.onChange}
      />
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
