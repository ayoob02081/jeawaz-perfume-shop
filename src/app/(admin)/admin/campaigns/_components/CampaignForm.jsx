"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import RHFTextField from "@/ui/RHFTextField";
import RHFRadioButton from "@/ui/RHFRadioButton";
import PersianDateRHForm from "@/ui/PersianDateRHForm";
import ProductPicker, {
  ProductSummary,
  productDisplayName,
} from "../../_components/picker/ProductPicker";
import SelectedEntityList from "../../_components/picker/SelectedEntityList";
import {
  campaignProductSnapshots,
  campaignScopeProductType,
  removeFromSelection,
  toCampaignProductsPayload,
} from "@/utils/entityPickerContract.mjs";

import { useAddCampaign, useEditCampaign } from "@/hooks/useCampaigns";
import ActionButtons from "../../_components/ActionButtons";

const SCOPE_VARIANT_LABELS = { sealed: "پلمپ", decant: "دکانت" };

function CampaignForm({ campaignToEdit }) {
  const isEdit = Boolean(campaignToEdit);
  const { id } = campaignToEdit || {};

  const { addCampaign, isAdding } = useAddCampaign();
  const { editCampaign, isEditing } = useEditCampaign(id);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // The scope the current selection was picked under; a later scope change
  // keeps the products but warns that the backend may reject some.
  const [selectionScope, setSelectionScope] = useState(
    campaignToEdit?.scope || "product",
  );

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

      // Snapshots for display; only their IDs are sent. An `all` Campaign
      // never seeds a manual selection.
      selectedProducts: campaignProductSnapshots(campaignToEdit),
    },
  });

  const scope = watch("scope");
  const status = watch("status");
  const selectionMode = watch("selectionMode");

  const {
    field: productsField,
    fieldState: { error: productsError },
  } = useController({
    name: "selectedProducts",
    control,
    rules: {
      validate: (value, values) =>
        values.selectionMode !== "manual" ||
        value.length > 0 ||
        "حداقل یک محصول باید انتخاب شود",
    },
  });
  const selectedProducts = productsField.value;
  const scopeVariant = SCOPE_VARIANT_LABELS[scope];
  const showScopeWarning =
    selectedProducts.length > 0 && scopeVariant && scope !== selectionScope;

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
      payload.products = toCampaignProductsPayload(data.selectedProducts);
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative space-y-8 w-full"
      >
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
            <SelectedEntityList
              label="محصولات کمپین"
              isRequired
              items={selectedProducts}
              entityLabel="محصول"
              addLabel="انتخاب محصولات"
              emptyText="هنوز محصولی انتخاب نشده است."
              renderItem={(product) => <ProductSummary product={product} />}
              getItemName={productDisplayName}
              onOpen={() => setIsPickerOpen(true)}
              onRemove={(productId) =>
                productsField.onChange(
                  removeFromSelection(selectedProducts, productId),
                )
              }
              onClear={() => productsField.onChange([])}
              error={productsError?.message}
            />

            {showScopeWarning && (
              <p role="status" className="text-sm text-orange">
                نوع کمپین تغییر کرده است. انتخاب‌ها حذف نشده‌اند، اما محصولاتی
                که بخش {scopeVariant} ندارند هنگام ذخیره رد می‌شوند.
              </p>
            )}
          </div>
        )}

        {selectionMode === "all" && (
          <p className="text-xs text-stroke-500">
            همه محصولات فعلی در زمان ذخیره در کمپین قرار می‌گیرند؛ محصولاتی که
            بعداً اضافه شوند خودکار به این کمپین اضافه نمی‌شوند.
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

        {/* Action Buttons */}
        <ActionButtons
          confurmLabel={isEdit ? "ویرایش کمپین" : "ساخت کمپین"}
          isPending={isSubmitting || isAdding || isEditing}
        />
      </form>

      {/* Outside the form: nothing in the picker can submit it. */}
      <ProductPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        value={selectedProducts}
        onConfirm={(products) => {
          productsField.onChange(products);
          setSelectionScope(scope);
        }}
        forcedType={campaignScopeProductType(scope)}
      />
    </div>
  );
}

export default CampaignForm;
