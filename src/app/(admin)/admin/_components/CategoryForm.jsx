"use client";

import toast, { Toaster } from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import {
  useAddCategory,
  useEditCategory,
  useRemoveCategory,
} from "@/hooks/useCategories";
import RHFTextField from "@/ui/RHFTextField";
import { useRouter } from "next/navigation";
import RHFUploadFile from "@/ui/RHFUploadFile";

function CategoryForm({ categoryToEdit, accord, gender }) {
  const basicInfoData = [
    {
      id: 1,
      label: "عنوان فارسی",
      name: "title",
      placeholder: accord ? "گلی" : "مردانه",
    },
    {
      id: 2,
      label: "عنوان انگلیسی",
      name: "value",
      placeholder: accord ? "floral" : "men",
    },
    {
      id: 3,
      label: "توضیحات",
      name: "description",
      placeholder: accord ? "رایحه گلی" : "عطر مردانه",
    },
  ];

  const router = useRouter();

  const { id, title, value, description, imageUrl, iconUrl, type } =
    categoryToEdit || {};

  const { isDeleting, removeCategory } = useRemoveCategory();

  const removeCategoryHandler = async (category) => {
    const { id } = category;
    await removeCategory(id);
    router.back();
  };

  const { addCategory, isAdding } = useAddCategory();
  const { editCategory, isEditing } = useEditCategory(id);

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      title: title || "",
      value: value || "",
      description: description || "",
      imageUrl: imageUrl || "",
      iconUrl: iconUrl || "",
      type: type || accord || gender,
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      value: data.value,
      description: data.description,
      imageUrl: data.imageUrl,
      iconUrl: data.iconUrl,
      type: data.type,
    };

    if (!categoryToEdit) {
      await addCategory(payload);
    } else {
      await editCategory(payload);
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

        {/* IconUrl & ImageUrl */}
        <div className="flex flex-col items-start gap-y-4 w-fit bg-stroke-100 p-6 rounded-3xl border border-slate-100">
          <h3 className="text-stroke-800 font-bold text-lg">
            آیکون و عکس {accord ? "رایحه" : "جنسیت"}
          </h3>
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
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <RHFUploadFile
                  label="انتخاب عکس"
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
              {accord &&
                (!categoryToEdit
                  ? isSubmitting
                    ? "در حال ساخت..."
                    : "ساخت رایحه"
                  : isEditing
                    ? "در حال ویرایش..."
                    : "ویرایش رایحه")}
              {gender &&
                (!categoryToEdit
                  ? isSubmitting
                    ? "در حال ساخت..."
                    : "ساخت جنسیت"
                  : isEditing
                    ? "در حال ویرایش..."
                    : "ویرایش جنسیت")}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>
          {categoryToEdit && (
            <button
              type="submit"
              disabled={isDeleting}
              onClick={() => removeCategoryHandler(categoryToEdit)}
              className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isDeleting ? "در حال حذف..." : "حذف دسته‌بندی"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CategoryForm;
