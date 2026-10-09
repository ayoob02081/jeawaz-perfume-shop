"use client";

import { useRef, useState } from "react";
import { useController, useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import RHFTextAreaField from "@/ui/RHFTextAreaField";
import ConfirmModal from "@/ui/ConfirmModal";
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
import {
  ADMIN_NOTIFICATIONS_PATH,
  NOTIFICATION_MESSAGE_MAX,
  NOTIFICATION_MESSAGE_MIN,
  NOTIFICATION_TITLE_MAX,
  NOTIFICATION_TITLE_MIN,
  getNotificationSendConfirmation,
  sendsSms,
  validateNotificationText,
} from "@/utils/notificationsContract.mjs";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import ActionButtons from "../../_components/ActionButtons";

// Same limits and messages as the backend DTO (trimmed text).
const titleRules = {
  validate: (value) =>
    validateNotificationText(value, {
      label: "عنوان اعلان",
      min: NOTIFICATION_TITLE_MIN,
      max: NOTIFICATION_TITLE_MAX,
    }),
};
const messageRules = {
  validate: (value) =>
    validateNotificationText(value, {
      label: "متن اعلان",
      min: NOTIFICATION_MESSAGE_MIN,
      max: NOTIFICATION_MESSAGE_MAX,
    }),
};

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
  // A send to every user, or with SMS, waits here for confirmation.
  const [pendingSend, setPendingSend] = useState(null);
  // Closes before the mutation's pending state renders: a second click can
  // never create a second notification.
  const submitLock = useRef(false);

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
  const channel = watch("channel");
  const messageLength = (watch("message") ?? "").trim().length;

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

  // mutate does not wait for the server: leave only after a confirmed
  // success, to the admin list; a failed send keeps the form and selection.
  // Only a failure releases the lock: after a success the filled form stays
  // mounted until the list renders, and must not send it again.
  const send = (payload) => {
    if (submitLock.current || isSending) return;
    submitLock.current = true;
    sendNotification(payload, {
      onSuccess: () => router.replace(ADMIN_NOTIFICATIONS_PATH),
      onSettled: (_data, error) => {
        if (error) submitLock.current = false;
      },
    });
  };

  const onSubmit = (data) => {
    // Sending, or sent and leaving: no second confirmation or request.
    if (submitLock.current) return;

    const payload = {
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      channel: data.channel,
      // userIds only for USER; ALL omits it.
      ...buildNotificationTargetPayload({
        target: data.target,
        selectedUsers: data.selectedUsers,
      }),
    };

    const confirmation = getNotificationSendConfirmation({
      target: payload.target,
      channel: payload.channel,
      recipientCount: payload.userIds?.length ?? 0,
    });
    if (confirmation) {
      setPendingSend({ payload, confirmation });
      return;
    }
    send(payload);
  };

  const cancelSend = () => setPendingSend(null);

  const confirmSend = () => {
    const payload = pendingSend?.payload;
    setPendingSend(null);
    if (payload) send(payload);
  };

  return (
    <div className="max-w-6xl p-6 w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RHFTextField
            register={register}
            errors={errors}
            isRequired
            label="عنوان اعلان"
            name="title"
            textClassName="font-bold"
            className="rounded-xl w-full"
            validationSchema={titleRules}
            maxLength={NOTIFICATION_TITLE_MAX}
            placeholder="مثال: به‌روزرسانی سایت"
            isPrimary
          />
          <div className="flex flex-col gap-1 md:col-span-2">
            <RHFTextAreaField
              register={register}
              errors={errors}
              isRequired
              label="متن اعلان"
              name="message"
              textClassName="font-bold"
              className="rounded-xl w-full min-h-28 p-3"
              rows={4}
              validationSchema={messageRules}
              maxLength={NOTIFICATION_MESSAGE_MAX}
              placeholder="مثال: متن اعلان را وارد کنید..."
              isPrimary
            />
            <p className="text-xs text-stroke-500 mr-2">
              {toPersianNumbers(messageLength)} از{" "}
              {toPersianNumbers(NOTIFICATION_MESSAGE_MAX)} نویسه
              {sendsSms(channel) &&
                " — همین متن پیامک می‌شود؛ هر حدود ۷۰ نویسه فارسی یک بخش پیامک است."}
            </p>
          </div>
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

      {/* Outside the form as well: its confirm button is type="submit". */}
      <ConfirmModal
        isOpen={Boolean(pendingSend)}
        onClose={cancelSend}
        cancellBtn={cancelSend}
        confirmBtn={confirmSend}
      >
        {pendingSend && (
          <SendConfirmation
            title={pendingSend.payload.title}
            confirmation={pendingSend.confirmation}
          />
        )}
      </ConfirmModal>
    </div>
  );
}

export default NotifForm;

function SendConfirmation({ title, confirmation }) {
  return (
    <div className="flex flex-col items-start gap-3 max-w-md text-stroke-800">
      <h2
        className={`font-bold text-lg ${confirmation.emphasize ? "text-error" : ""}`}
      >
        {confirmation.title}
      </h2>
      <p className="text-sm">
        <span className="font-bold">عنوان: </span>
        {title}
      </p>
      <p className="text-sm">
        <span className="font-bold">گیرندگان: </span>
        {confirmation.audience}
      </p>
      <p className="text-sm">
        <span className="font-bold">کانال ارسال: </span>
        {confirmation.channel}
      </p>
      {confirmation.smsWarning && (
        <p
          className={`text-sm rounded-xl p-3 ${confirmation.emphasize ? "bg-error/10 text-error font-bold" : "bg-orange/10 text-orange"}`}
        >
          {confirmation.smsWarning}
        </p>
      )}
    </div>
  );
}

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
