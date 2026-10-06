"use client";
import { useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import { useUpdateUser } from "@/hooks/useUsers";
import PersianDateRHForm from "../../../../ui/PersianDateRHForm";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { normalizeIranPhone } from "@/utils/toPersianNumbers";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import {
  PERSIAN_NAME_PATTERN,
  buildProfileUpdatePayload,
  profileFormValuesFromUser,
  validateOptionalNationalCode,
  validateUsername,
} from "@/utils/profileFormContract.mjs";
import PhoneChangeDialog from "./PhoneChangeDialog";

const getBasicInfoData = ({ username }) => [
  {
    id: 1,
    label: "نام",
    name: "firstName",
    placeholder: "رضا",
    type: "text",
    isRequired: true,
    validationSchema: {
      required: "نام الزامی است",
      minLength: {
        value: 2,
        message: "نام باید حداقل ۲ کاراکتر باشد",
      },
      maxLength: {
        value: 50,
        message: "نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد",
      },
      pattern: {
        value: PERSIAN_NAME_PATTERN,
        message: "نام فقط می‌تواند شامل حروف فارسی باشد",
      },
    },
  },
  {
    id: 2,
    label: "نام خانوادگی",
    name: "lastName",
    placeholder: "کریمی",
    type: "text",
    isRequired: true,
    validationSchema: {
      required: "نام خانوادگی الزامی است",
      minLength: {
        value: 2,
        message: "نام خانوادگی باید حداقل ۲ کاراکتر باشد",
      },
      maxLength: {
        value: 50,
        message: "نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد",
      },
      pattern: {
        value: PERSIAN_NAME_PATTERN,
        message: "نام خانوادگی فقط می‌تواند شامل حروف فارسی باشد",
      },
    },
  },
  {
    // Identity/login data: shown, never edited or submitted here.
    id: 3,
    label: "شماره موبایل",
    name: "phoneNumber",
    type: "tel",
    readOnly: true,
  },
  {
    id: 4,
    label: "نام کاربری",
    name: "username",
    placeholder: "RezaJ",
    type: "text",
    isRequired: !!username,
    validationSchema: {
      validate: (value) => validateUsername(value, username),
    },
  },
  {
    id: 5,
    label: "ایمیل",
    name: "email",
    placeholder: "example@gmail.com",
    type: "email",
    isRequired: false,
    validationSchema: {
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "ایمیل معتبر نیست",
      },
    },
  },
  {
    id: 6,
    label: "کد ملی",
    name: "nationalCode",
    placeholder: "۰۱۲۳۴۵۶۷۸۹",
    type: "tel",
    isRequired: false,
    validationSchema: {
      pattern: {
        value: /^\d{10}$/,
        message: "کد ملی باید ۱۰ رقم باشد",
      },
      validate: validateOptionalNationalCode,
    },
  },
];

function EditProfileForm() {
  const router = useRouter();
  const { user: userToEdit } = useAuth();

  const { isUpdating, updateUser } = useUpdateUser();
  const [isPhoneChangeOpen, setIsPhoneChangeOpen] = useState(false);
  const { phoneNumber, username } = userToEdit || {};
  const basicInfoData = getBasicInfoData({ username });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: profileFormValuesFromUser(null),
  });

  useEffect(() => {
    if (!userToEdit) return;

    reset(profileFormValuesFromUser(userToEdit));
  }, [userToEdit, reset]);

  const onSubmit = async (data) => {
    try {
      await updateUser(buildProfileUpdatePayload(data));
    } catch {
      // useUpdateUser already reported the failure; the form stays editable.
    }
  };

  const isPending = isSubmitting || isUpdating;

  return (
    <div className="max-w-6xl w-full px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {basicInfoData.map((item) =>
            item.readOnly ? (
              <div key={item.name} className="flex flex-col gap-2 w-full">
                <RHFTextField
                  label={item.label}
                  name={item.name}
                  type={item.type}
                  value={normalizeIranPhone(phoneNumber)}
                  readOnly
                  aria-readonly="true"
                  aria-describedby={`${item.name}-hint`}
                  className="w-full cursor-not-allowed text-stroke-500"
                >
                  <LockClosedIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-stroke-500"
                  />
                </RHFTextField>
                <div className="flex items-center justify-between gap-3 mr-2">
                  <p
                    id={`${item.name}-hint`}
                    className="text-xs text-stroke-600"
                  >
                    تغییر شماره موبایل با تایید پیامکی انجام می‌شود
                  </p>
                  {/* A verified flow with its own dialog; the field itself
                      is never edited or submitted. */}
                  <button
                    type="button"
                    onClick={() => setIsPhoneChangeOpen(true)}
                    className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    تغییر شماره موبایل
                  </button>
                </div>
              </div>
            ) : (
              <RHFTextField
                key={item.name}
                register={register}
                control={control}
                errors={errors}
                isRequired={item.isRequired}
                label={item.label}
                name={item.name}
                type={item.type}
                className="w-full"
                validationSchema={item.validationSchema}
                placeholder={`مثال: ${item.placeholder}`}
              />
            ),
          )}
          <PersianDateRHForm
            control={control}
            name="birthday"
            label="تولد"
            className="w-full"
            placeholder="مثال: ۱۳۸۱/۲/۴"
            valueFormat="date"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              type="submit"
              disabled={isPending}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isPending ? "در حال ویرایش..." : "ویرایش اطلاعات"}
            </button>
            <div
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </div>
          </div>
        </div>
      </form>
      {/* Outside the profile form: Enter in the dialog never submits it. */}
      <PhoneChangeDialog
        isOpen={isPhoneChangeOpen}
        onClose={() => setIsPhoneChangeOpen(false)}
        currentPhone={phoneNumber}
      />
    </div>
  );
}

export default EditProfileForm;
