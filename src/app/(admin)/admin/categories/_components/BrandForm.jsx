"use client";

import { Controller, useForm } from "react-hook-form";
import {
  useAddBrand,
  useEditBrand,
  useRemoveBrand,
} from "@/hooks/useCategories";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import RHFUploadFile from "@/ui/RHFUploadFile";
import ActionButtons from "../../_components/ActionButtons";
import RHFTextAreaField from "@/ui/RHFTextAreaField";
import {
  SEARCH_ALIASES_HELP,
  searchAliasesPayload,
} from "@/utils/searchAliasesContract.mjs";

const basicInfoData = [
  {
    id: 1,
    label: "عنوان فارسی",
    name: "title",
    placeholder: "دیور",
  },
  {
    id: 2,
    label: "عنوان انگلیسی",
    name: "value",
    placeholder: "Dior",
  },
  {
    id: 3,
    label: "توضیحات",
    name: "description",
    placeholder: "برند دیور",
  },
];

// `searchAliases` (edit): the stored aliases from the admin route;
// `searchAliasesUnavailable`: they could not be read, so the field is
// disabled and left out of the update (the stored aliases are kept).
function BrandForm({ brandToEdit, searchAliases, searchAliasesUnavailable = false }) {
  const router = useRouter();

  const { id, title, value, iconUrl, description } = brandToEdit || {};

  const { isDeleting, removeBrand } = useRemoveBrand();

  const removeCategoryHandler = async (category) => {
    const { id } = category;
    await removeBrand(id);
    router.back();
  };

  const { addBrand, isAdding } = useAddBrand();
  const { editBrand, isEditing } = useEditBrand(id);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      title: title || "",
      value: value || "",
      iconUrl: iconUrl || "",
      description: description || "",
      searchAliases: searchAliases ?? "",
    },
  });

  const onSubmit = async (data) => {
    const aliases = searchAliasesUnavailable
      ? null
      : searchAliasesPayload(data.searchAliases);
    if (aliases?.error) {
      setError("searchAliases", { type: "validate", message: aliases.error });
      return;
    }

    const payload = {
      title: data.title,
      value: data.value,
      iconUrl: data.iconUrl,
      description: data.description,
      ...(aliases ? { searchAliases: aliases.value } : {}),
    };

    if (!brandToEdit) {
      await addBrand(payload);
    } else {
      await editBrand(payload);
    }

    router.back();
  };

  return (
    <div className="max-w-6xl w-full px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
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
              className="  rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder={`مثال: ${item.placeholder}`}
            />
          ))}
        </div>

        {/* Search-only aliases (other spellings, Persian/English names): a
            search for any of them finds every Product of the brand. */}
        <div className="flex flex-col gap-1 w-full">
          <RHFTextAreaField
            name="searchAliases"
            textClassName="font-bold"
            errors={errors}
            label="نام‌های جایگزین جستجو"
            register={register}
            dir="auto"
            rows={3}
            disabled={searchAliasesUnavailable}
            placeholder={"آمواج\nامواژ"}
            className="rounded-xl w-full"
          />
          <p className="text-xs text-stroke-600 mr-2">
            {searchAliasesUnavailable
              ? "نام‌های جایگزین فعلی دریافت نشد؛ بدون تغییر باقی می‌مانند."
              : SEARCH_ALIASES_HELP}
          </p>
        </div>

        {/* IconUrl */}
        <div className="flex flex-col items-start gap-y-4 w-fit bg-stroke-100 p-6 rounded-3xl border border-slate-100">
          <h3 className="text-stroke-800 font-bold text-lg">آیکون برند</h3>
          <div className="flex flex-wrap gap-6">
            <Controller
              name="iconUrl"
              control={control}
              render={({ field }) => (
                <RHFUploadFile
                  label="انتخاب آیکون"
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange("")}
                  type="brand"
                />
              )}
            />
          </div>
          {errors.images && (
            <p className="text-error text-xs">{errors.images.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <ActionButtons
          confurmLabel={
            !brandToEdit
              ? isSubmitting
                ? "در حال ساخت..."
                : "ساخت برند"
              : isEditing
                ? "در حال ویرایش..."
                : "ویرایش برند"
          }
          isPending={isSubmitting || isEditing}
        />
      </form>
    </div>
  );
}

export default BrandForm;
