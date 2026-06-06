"use client";

import { Toaster } from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import {
  useAddBrand,
  useEditBrand,
  useRemoveBrand,
} from "@/hooks/useCategories";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import RHFUploadFile from "@/ui/RHFUploadFile";

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

function BrandForm({ brandToEdit }) {
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
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      title: title || "",
      value: value || "",
      iconUrl: iconUrl || "",
      description: description || "",
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      value: data.value,
      iconUrl: data.iconUrl,
      description: data.description,
    };

    if (!brandToEdit) {
      await addBrand(payload);
    } else {
      await editBrand(payload);
    }

    router.back();
  };

  return (
    <div className="max-w-6xl mx-auto p-10">
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
              className="  rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder={`مثال: ${item.placeholder}`}
            />
          ))}
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
                />
              )}
            />
          </div>
          {errors.images && (
            <p className="text-error text-xs">{errors.images.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              type="submit"
              disabled={isSubmitting || isEditing}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {!brandToEdit
                ? isSubmitting
                  ? "در حال ساخت..."
                  : "ساخت برند"
                : isEditing
                  ? "در حال ویرایش..."
                  : "ویرایش برند"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>
          {brandToEdit && (
            <button
              type="submit"
              disabled={isDeleting}
              onClick={() => removeCategoryHandler(brandToEdit)}
              className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isDeleting ? "در حال حذف..." : "حذف برند"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default BrandForm;
