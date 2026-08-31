"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import RHFTextField from "@/ui/RHFTextField";
import RHFRadioButton from "@/ui/RHFRadioButton";
import PersianDateRHForm from "@/ui/PersianDateRHForm";

import { useAddCampaign, useEditCampaign } from "@/hooks/useCampaigns";

function CampaignForm({ campaignToEdit }) {
  const router = useRouter();

  const isEdit = Boolean(campaignToEdit);
  const { id } = campaignToEdit || {};

  const { addCampaign, isAdding } = useAddCampaign();
  const { editCampaign, isEditing } = useEditCampaign(id);

  const existingProductIds =
    campaignToEdit?.products
      ?.map((item) => {
        if (typeof item === "number") {
          return item;
        }

        return item?.productId ?? item?.product?.id;
      })
      .filter(Boolean)
      .join(",") || "";

  const {
    register,
    watch,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      title: campaignToEdit?.title || "",
      description: campaignToEdit?.description || "",

      discountPercent: campaignToEdit?.discountPercent ?? "",

      scope: campaignToEdit?.scope || "product",

      selectionMode: campaignToEdit?.selectionMode || "manual",

      startsAt: campaignToEdit?.startsAt || "",
      endsAt: campaignToEdit?.endsAt || "",

      status: campaignToEdit?.status || "draft",

      productIds: existingProductIds,
    },
  });

  const scope = watch("scope");
  const status = watch("status");
  const selectionMode = watch("selectionMode");

  const onSubmit = async (data) => {
    const payload = {
      title: data.title.trim(),

      description: data.description?.trim() || undefined,

      discountPercent: Number(data.discountPercent),

      scope: data.scope,

      selectionMode: data.selectionMode,

      startsAt: data.startsAt,

      endsAt: data.endsAt,

      status: data.status,
    };

    // فقط در حالت manual محصولات را ارسال می‌کنیم
    if (data.selectionMode === "manual") {
      const productIds = data.productIds
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0);

      payload.products = productIds.map((productId) => ({
        productId,
      }));
    }

    if (isEdit) {
      await editCampaign(payload);
    } else {
      await addCampaign(payload);
    }

    // router.back();
  };

  return (
    <div className="max-w-5xl w-full border-stroke-300 max-xl:px-4">
      <Toaster />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
        {/* BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <RHFTextField
            textClassName="font-bold"
            label="عنوان کمپین"
            name="title"
            register={register}
            errors={errors}
            isRequired
            validationSchema={{
              required: "عنوان کمپین ضروری است",
            }}
          />

          <RHFTextField
            textClassName="font-bold"
            label="توضیحات کمپین"
            name="description"
            register={register}
            errors={errors}
          />
        </div>

        {/* DISCOUNT */}
        <div className="max-w-md">
          <RHFTextField
            textClassName="font-bold"
            label="درصد تخفیف"
            name="discountPercent"
            register={register}
            errors={errors}
            isRequired
            validationSchema={{
              required: "درصد تخفیف ضروری است",
              min: {
                value: 1,
                message: "حداقل تخفیف ۱ درصد است",
              },
              max: {
                value: 100,
                message: "حداکثر تخفیف ۱۰۰ درصد است",
              },
            }}
            type="number"
          />
        </div>

        {/* SCOPE */}
        <div className="space-y-3">
          <p className="font-bold">نوع کمپین</p>

          <div className="flex flex-wrap gap-4">
            <RHFRadioButton
              id="scope-product"
              name="scope"
              value="product"
              register={register}
              checked={scope === "product"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  scope === "product"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                کمپین محصول
              </p>
            </RHFRadioButton>

            <RHFRadioButton
              id="scope-decant"
              name="scope"
              value="decant"
              register={register}
              checked={scope === "decant"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  scope === "decant"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                کمپین دکانت
              </p>
            </RHFRadioButton>

            <RHFRadioButton
              id="scope-sealed"
              name="scope"
              value="sealed"
              register={register}
              checked={scope === "sealed"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  scope === "sealed"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                کمپین محصول پلمپ
              </p>
            </RHFRadioButton>
          </div>
        </div>

        {/* SELECTION MODE */}
        <div className="space-y-3">
          <p className="font-bold">انتخاب محصولات</p>

          <div className="flex flex-wrap gap-4">
            <RHFRadioButton
              id="selection-manual"
              name="selectionMode"
              value="manual"
              register={register}
              checked={selectionMode === "manual"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  selectionMode === "manual"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                انتخاب دستی
              </p>
            </RHFRadioButton>

            <RHFRadioButton
              id="selection-all"
              name="selectionMode"
              value="all"
              register={register}
              checked={selectionMode === "all"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  selectionMode === "all"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                همه محصولات
              </p>
            </RHFRadioButton>
          </div>
        </div>

        {/* PRODUCTS */}
        {selectionMode === "manual" && (
          <div className="space-y-2">
            <RHFTextField
              textClassName="font-bold"
              label="آی‌دی محصولات"
              name="productIds"
              register={register}
              errors={errors}
              isRequired
              placeholder="مثلاً: 12,15,21"
              validationSchema={{
                required: "حداقل یک محصول باید انتخاب شود",
                validate: (value) => {
                  const ids = value
                    .split(",")
                    .map((item) => Number(item.trim()))
                    .filter(Boolean);

                  if (!ids.length) {
                    return "حداقل یک محصول باید انتخاب شود";
                  }

                  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
                    return "آی‌دی محصولات نامعتبر است";
                  }

                  return true;
                },
              }}
            />

            <p className="text-xs text-stroke-500">
              آی‌دی محصولات را با کاما از هم جدا کنید. مثال: 12,15,21
            </p>
          </div>
        )}

        {selectionMode === "all" && (
          <p className="text-xs text-stroke-500">
            تمام محصولات موجود در کمپین قرار خواهند گرفت.
          </p>
        )}

        {/* DATES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PersianDateRHForm
            control={control}
            textClassName="font-bold"
            name="startsAt"
            label="تاریخ شروع"
            isRequired
            errors={errors}
            validationSchema={{
              required: "تاریخ شروع ضروری است",
            }}
          />

          <PersianDateRHForm
            control={control}
            textClassName="font-bold"
            name="endsAt"
            label="تاریخ پایان"
            isRequired
            errors={errors}
            validationSchema={{
              required: "تاریخ پایان ضروری است",
            }}
          />
        </div>

        {/* STATUS */}
        <div className="space-y-3">
          <p className="font-bold">وضعیت کمپین</p>

          <div className="flex flex-wrap gap-4">
            <RHFRadioButton
              id="status-draft"
              name="status"
              value="draft"
              register={register}
              checked={status === "draft"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  status === "draft"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                پیش‌نویس
              </p>
            </RHFRadioButton>

            <RHFRadioButton
              id="status-active"
              name="status"
              value="active"
              register={register}
              checked={status === "active"}
            >
              <p
                className={`flex items-center justify-center border-primary font-bold ${
                  status === "active"
                    ? "border-2 text-primary bg-stroke-0"
                    : "opacity-70"
                } px-4 py-2 h-10 lg:h-12 rounded-full duration-200`}
              >
                فعال
              </p>
            </RHFRadioButton>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              type="submit"
              disabled={isSubmitting || isAdding || isEditing}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isEdit ? "ویرایش کمپین" : "ساخت کمپین"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CampaignForm;
