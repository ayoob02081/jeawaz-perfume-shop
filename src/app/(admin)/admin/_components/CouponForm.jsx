"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import RHFTextField from "@/ui/RHFTextField";
import RHFCheckBox from "@/ui/RHFCheckBox";
import RHFRadioButton from "@/ui/RHFRadioButton";
import {
  useAddCoupon,
  useEditCoupon,
  useRemoveCoupon,
} from "@/hooks/useCoupons";
import PersianDateRHForm from "@/ui/PersianDateRHForm";

function CouponForm({ couponToEdit }) {
  const router = useRouter();

  const { id } = couponToEdit || {};

  const { addCoupon, isAdding } = useAddCoupon();
  const { editCoupon, isEditing } = useEditCoupon(id);
  const { isDeleting, removeCoupon } = useRemoveCoupon();

  const {
    register,
    watch,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      code: couponToEdit?.code || "",
      title: couponToEdit?.title || "",
      description: couponToEdit?.description || "",

      type: couponToEdit?.type || "PERCENT",
      discountValue: couponToEdit?.discountValue || "",

      maxDiscount: couponToEdit?.maxDiscount || "",
      minOrderAmount: couponToEdit?.minOrderAmount || "",

      usageLimit: couponToEdit?.usageLimit || "",
      usageLimitPerUser: couponToEdit?.usageLimitPerUser || "",

      startsAt: couponToEdit?.startsAt || "",
      expiresAt: couponToEdit?.expiresAt || "",

      target: couponToEdit?.target || "ALL",
      userIds: couponToEdit?.userIds?.join(",") || "",

      isActive: couponToEdit?.isActive ?? true,
    },
  });

  const type = watch("type");
  const target = watch("target");

  const onSubmit = async (data) => {
    const payload = {
      code: data.code,
      title: data.title,
      description: data.description,

      type: data.type,
      discountValue: Number(data.discountValue),

      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
      minOrderAmount: data.minOrderAmount
        ? Number(data.minOrderAmount)
        : undefined,

      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      usageLimitPerUser: data.usageLimitPerUser
        ? Number(data.usageLimitPerUser)
        : undefined,

      startsAt: data.startsAt || undefined,
      expiresAt: data.expiresAt || undefined,

      target: data.target,

      userIds:
        data.target === "USERS"
          ? data.userIds
              .split(",")
              .map((x) => Number(x.trim()))
              .filter(Boolean)
          : undefined,

      isActive: data.isActive,
    };

    if (couponToEdit) {
      await editCoupon(payload);
    } else {
      await addCoupon(payload);
    }

    router.back();
  };

  const handleDelete = async () => {
    await removeCoupon(id);
    router.back();
  };

  return (
    <div className="max-w-5xl mx-auto w-full order border-stroke-300">
      <Toaster />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
        {/* BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          <RHFTextField
            textClassName="font-bold"
            label="مقدار کد"
            name="code"
            register={register}
            errors={errors}
            isRequired
            validationSchema={{ required: "مقدار کد ضروری است" }}
          />
          <RHFTextField
            textClassName="font-bold"
            label="عنوان کد"
            name="title"
            register={register}
            errors={errors}
            isRequired
            validationSchema={{ required: "عنوان کد ضروری است" }}
          />
          <RHFTextField
            textClassName="font-bold"
            label="توضیحات کد"
            name="description"
            register={register}
          />
        </div>

        {/* TYPE */}
        <div className="flex gap-4">
          <RHFRadioButton
            id="percent"
            name="type"
            value="PERCENT"
            register={register}
            checked={watch("type") === "PERCENT"}
          >
            <p
              className={`flex items-center justify-center border-primary font-bold ${watch("type") === "PERCENT" ? "border-2 text-primary bg-stroke-0" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
            >
              درصدی
            </p>
          </RHFRadioButton>

          <RHFRadioButton
            id="fixed"
            name="type"
            value="FIXED"
            register={register}
            checked={watch("type") === "FIXED"}
          >
            <p
              className={`flex items-center justify-center border-primary font-bold ${watch("type") === "FIXED" ? "border-2 text-primary bg-stroke-0" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
            >
              مبلغ ثابت
            </p>
          </RHFRadioButton>
        </div>

        {/* DISCOUNT VALUE */}
        <RHFTextField
          textClassName="font-bold"
          label={`مقدار تخفیف ${watch("type") === "FIXED" ? "(تومان)" : "(درصد)"}`}
          name="discountValue"
          isRequired
          errors={errors}
          register={register}
          control={control}
          validationSchema={{ required: "مقدار تخفیف ضروری است" }}
          isPrice
        />

        {/* CONDITIONAL PERCENT */}
        {type === "PERCENT" && (
          <RHFTextField
            textClassName="font-bold"
            label="حداکثر تخفیف (تومان)"
            name="maxDiscount"
            isRequired
            errors={errors}
            register={register}
            control={control}
            validationSchema={{ required: "حداکثر تخفیف ضروری است" }}
            isPrice
          />
        )}

        {/* LIMITS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
          <RHFTextField
            textClassName="font-bold"
            label="حداقل خرید (تومان)"
            name="minOrderAmount"
            isRequired
            errors={errors}
            register={register}
            control={control}
            validationSchema={{ required: "حداقل خرید ضروری است" }}
            isPrice
          />

          <RHFTextField
            textClassName="font-bold"
            label="تعداد کاربرهای مجاز"
            name="usageLimit"
            isRequired
            errors={errors}
            register={register}
            control={control}
            validationSchema={{ required: "تعداد کاربرهای مجاز ضروری است" }}
            isPrice
          />

          <RHFTextField
            textClassName="font-bold"
            label="تعداد استفاده (هر کاربر)"
            name="usageLimitPerUser"
            isRequired
            errors={errors}
            register={register}
            control={control}
            validationSchema={{ required: "تعداد استفاده هر کاربر ضروری است" }}
            isPrice
          />
        </div>

        {/* DATES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PersianDateRHForm
            control={control}
            textClassName="font-bold"
            name="startsAt"
            label="تاریخ شروع"
            isRequired
            errors={errors}
            validationSchema={{ required: "تاریخ شروع ضروری است" }}
          />
          <PersianDateRHForm
            control={control}
            textClassName="font-bold"
            label="تاریخ پایان"
            name="expiresAt"
            isRequired
            errors={errors}
            validationSchema={{ required: "تاریخ پایان ضروری است" }}
          />
        </div>

        {/* TARGET */}
        <div className="flex gap-4">
          <RHFRadioButton
            id="all"
            name="target"
            value="ALL"
            register={register}
            checked={watch("target") === "ALL"}
          >
            <p
              className={`flex items-center justify-center border-primary font-bold ${watch("target") === "ALL" ? "border-2 text-primary bg-stroke-0" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
            >
              همه کاربران
            </p>
          </RHFRadioButton>

          <RHFRadioButton
            id="users"
            name="target"
            value="USERS"
            register={register}
            checked={watch("target") === "USERS"}
          >
            <p
              className={`flex items-center justify-center border-primary font-bold ${watch("target") === "USERS" ? "border-2 text-primary bg-stroke-0" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
            >
              کاربران خاص
            </p>
          </RHFRadioButton>
        </div>

        {/* USERS INPUT */}
        {target === "USERS" && (
          <RHFTextField
            textClassName="font-bold"
            label="آی‌دی کاربران"
            name="userIds"
            register={register}
            placeholder="1,2,3"
          />
        )}

        {/* ACTIVE */}
        <RHFCheckBox
          id="isActive"
          name="isActive"
          register={register}
          checked={watch("isActive")}
        >
          <p
            className={`flex items-center justify-center border-primary font-bold ${watch("isActive") ? "border-2 text-primary bg-stroke-0" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
          >
            کد فعال {watch("isActive") ? " باشد" : " نباشد"}
          </p>
        </RHFCheckBox>

        {/* ACTIONS */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              type="submit"
              disabled={isSubmitting || isAdding || isEditing}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {couponToEdit ? "ویرایش" : "ساخت"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>

          {couponToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              حذف
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CouponForm;
