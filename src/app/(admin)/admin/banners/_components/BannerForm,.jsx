"use client";

import { Controller, useForm } from "react-hook-form";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  useAddBanner,
  useEditBanner,
  useRemoveBanner,
  useToggleBanner,
} from "@/hooks/useBanners";

import RHFTextField from "@/ui/RHFTextField";
import RHFUploadFile from "@/ui/RHFUploadFile";
import PersianDateRHForm from "@/ui/PersianDateRHForm";
import RHFSelect from "@/ui/RHFSelect";
import { TrashIcon } from "@heroicons/react/24/solid";
import ConfirmModal from "@/ui/ConfirmModal";
import { useState } from "react";

const bannerTypeOptions = [
  {
    value: "primary",
    label: "بنر اصلی",
  },
  {
    value: "secondary",
    label: "بنر ثانویه",
  },
];

function BannerForm({ bannerToEdit }) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const router = useRouter();

  const { id } = bannerToEdit || {};

  const { addBanner, isAdding } = useAddBanner();
  const { editBanner, isEditing } = useEditBanner(id);
  const { removeBanner, isDeleting } = useRemoveBanner();
  const { toggleBanner, isToggling } = useToggleBanner();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      title: bannerToEdit?.title || "",
      imageUrl: bannerToEdit?.imageUrl || "",
      mobileImageUrl: bannerToEdit?.mobileImageUrl || "",
      link: bannerToEdit?.link || "",
      type: bannerToEdit?.type || "primary",
      isActive: bannerToEdit?.isActive ?? true,
      sortOrder: bannerToEdit?.sortOrder ?? 0,
      startsAt: bannerToEdit?.startsAt
        ? bannerToEdit.startsAt.slice(0, 16)
        : "",
      endsAt: bannerToEdit?.endsAt ? bannerToEdit.endsAt.slice(0, 16) : "",
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      imageUrl: data.imageUrl,
      mobileImageUrl: data.mobileImageUrl || undefined,
      link: data.link || undefined,
      type: data.type,
      isActive: data.isActive,
      sortOrder: Number(data.sortOrder) || 0,
      startsAt: data.startsAt
        ? new Date(data.startsAt).toISOString()
        : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
    };

    if (!bannerToEdit) {
      await addBanner(payload);
    } else {
      await editBanner(payload);
    }

    router.back();
  };

  const handleRemove = async () => {
    if (!bannerToEdit) return;

    await removeBanner(bannerToEdit.id);
    setConfirmModalOpen(false);
    router.back();
  };

  const handleToggle = async () => {
    if (!bannerToEdit) return;

    await toggleBanner(bannerToEdit.id);
  };

  const handleModal = (data) => {
    if (!data.id) {
      setConfirmModalOpen(false);
    }
    if (data?.id) {
      setConfirmModalOpen(true);
    }
  };

  const isBusy = isSubmitting || isAdding || isEditing;

  return (
    <div className="max-w-6xl w-full px-4">
      <Toaster />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
        {/* اطلاعات اصلی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RHFTextField
            register={register}
            isRequired
            label="عنوان بنر"
            name="title"
            textClassName="font-bold"
            className="rounded-xl w-full"
            validationSchema={{
              required: "عنوان بنر الزامی است",
            }}
            placeholder="مثال: تخفیف ویژه تابستان"
          />

          <RHFTextField
            dir="ltr"
            register={register}
            label="لینک بنر"
            name="link"
            textClassName="font-bold"
            className="rounded-xl w-full"
            placeholder="products?discounted=true :مثال"
          />
        </div>

        {/* Banner Type */}
        <div className="flex items-center justify-stretch gap-6">
          <RHFSelect
            options={bannerTypeOptions}
            label="نوع بنر"
            register={register}
            errors={errors}
            isRequired
            name="type"
            className="textField__input w-fit"
            validationSchema={{
              required: "نوع بنر الزامی است",
            }}
            defaultOption={false}
          />

          <RHFTextField
            control={control}
            register={register}
            label="ترتیب نمایش"
            isPrice={true}
            name="sortOrder"
            textClassName="font-bold"
            className="rounded-xl w-fit"
            validationSchema={{
              min: {
                value: 0,
                message: "ترتیب نمی‌تواند منفی باشد",
              },
            }}
            placeholder="مثال: 0"
          />
        </div>
        {/* Dates */}
        <div className="flex items-center justify-start flex-wra gap-6 w-full">
          <PersianDateRHForm
            control={control}
            name="startsAt"
            label="شروع نمایش"
            className="w-full"
            placeholder="مثال: ۱۴۰۵/۹/۲۷"
          />

          <PersianDateRHForm
            control={control}
            name="endsAt"
            label="پایان نمایش"
            className="w-full"
            placeholder="مثال: ۱۴۰۵/۱۰/۱"
          />
        </div>

        <div className="flex items-center justify-start flex-wrap gap-4 ">
          {/* Descktop Image */}
          <div className="grow flex flex-col items-center justify-center gap-y-4 max-sm:w-full w-fit bg-stroke-100 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-stroke-800 font-bold text-lg">
              تصویر بنر دسکتاپ
            </h3>

            <Controller
              name="imageUrl"
              control={control}
              rules={{
                required: "تصویر بنر الزامی است",
              }}
              render={({ field }) => (
                <RHFUploadFile
                  label="انتخاب تصویر"
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange("")}
                  type="banner"
                  ratio="aspect-video"
                />
              )}
            />

            {errors.imageUrl && (
              <p className="text-error text-xs">{errors.imageUrl.message}</p>
            )}
          </div>

          {/* Mobile Image */}
          <div className="grow flex flex-col items-center justify-center gap-y-4 max-sm:w-full w-fit bg-stroke-100 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-stroke-800 font-bold text-lg">
              تصویر بنر موبایل
            </h3>

            <Controller
              name="mobileImageUrl"
              control={control}
              render={({ field }) => (
                <RHFUploadFile
                  label="انتخاب تصویر موبایل"
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange("")}
                  type="banner-mobile"
                  ratio="aspect-video"
                />
              )}
            />
          </div>
        </div>

        {/* Banner Status */}
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            {...register("isActive")}
            className="size-5 accent-primary transition-all duration-200"
          />

          <span className="font-bold text-stroke-800 has-checked:text-primary">
            بنر فعال باشد
          </span>
        </label>

        {/* Buttons */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              type="submit"
              disabled={isBusy}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {!bannerToEdit
                ? isBusy
                  ? "در حال ساخت..."
                  : "ساخت بنر"
                : isEditing
                  ? "در حال ویرایش..."
                  : "ویرایش بنر"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>

          {bannerToEdit && (
            <div className="flex items-center justify-between gap-4 w-full">
              <button
                type="button"
                disabled={isToggling}
                onClick={handleToggle}
                className="btn btn--primary border-2 bg-warning hover:bg-stroke-0 hover:border-warning hover:text-warning py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
              >
                {isToggling
                  ? "در حال تغییر..."
                  : bannerToEdit.isActive
                    ? "غیرفعال کردن بنر"
                    : "فعال کردن بنر"}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleModal(bannerToEdit)}
                className="btn btn--primary gap-2 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
              >
                <TrashIcon className="size-5 text-stroke-0" />
                <p>{isDeleting ? "در حال حذف..." : "حذف"}</p>
              </button>
            </div>
          )}
        </div>
      </form>
      {confirmModalOpen && (
        <ConfirmModal
          cancellBtn={handleModal}
          confirmBtn={handleRemove}
          isOpen={confirmModalOpen}
          onClose={setConfirmModalOpen}
        >
          <span className="flex flex-wrap items-center justify-center gap-2 text-stroke-800 max-md:text-xl md:text-2xl">
            <p>بنر</p>
            <p>"{bannerToEdit.title}"</p>
            <p>حذف شود؟</p>
          </span>
        </ConfirmModal>
      )}
    </div>
  );
}

export default BannerForm;
