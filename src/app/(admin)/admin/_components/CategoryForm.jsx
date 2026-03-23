"use client";

import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRemoveCategory } from "@/hooks/useCategories";
import RHFTextField from "@/ui/RHFTextField";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useAddCategory from "../categories/useCreateCategory";
import useEditCategory from "../categories/useEditCategory";

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

  const queryClient = useQueryClient();
  const router = useRouter();

  const { id, title, value, description, imageUrl, iconUrl, type } =
    categoryToEdit || {};

  const { isDeleting, removeCategory } = useRemoveCategory();

  const removeCategoryHandler = async (category) => {
    const { id, title } = category;
    try {
      await removeCategory(id);
      queryClient.invalidateQueries(["get-categories"]);
      router.back();
      toast.success(`${title} با موفقیت حذف شد.`);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const { AddCategory, isAdding } = useAddCategory();
  const { editCategory, isEditing } = useEditCategory(id);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
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
      try {
        await AddCategory(payload);
        queryClient.invalidateQueries(["get-categories"]);
        router.back();
        toast.success("Category Created");
      } catch (error) {
        toast.error("Category Not Created");
      }
    }

    if (!!categoryToEdit) {
      try {
        await editCategory(payload);
        queryClient.invalidateQueries(["get-categories"]);
        router.back();
        toast.success("Category Updated");
      } catch (error) {
        toast.error("Category Not Updated");
      }
    }
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
              className="textField__input textField__input--2 rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder={`مثال: ${item.placeholder}`}
            />
          ))}
        </div>

        {/* IconUrl */}
        <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-stroke-800 font-bold max-md:text-base text-lg">
              {accord ? "آیکون رایحه" : "آیکون جنسیت"}
              <span className="text-error">*</span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-4">
            <div className="flex items-center justify-start gap-2 mb-2 h-full">
              <input
                dir="ltr"
                {...register(`iconUrl`)}
                placeholder="/icons/icon.png"
                className="textField__input textField__input--2 rounded-2xl w-full"
              />
            </div>
          </div>
        </div>

        {/* ImageUrl */}
        <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-stroke-800 font-bold max-md:text-base text-lg">
              {accord ? "عکس‌ رایحه" : "عکس‌ جنسیت"}
              <span className="text-error">*</span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-4">
            <div className="flex items-center justify-start gap-2 mb-2 h-full">
              <input
                dir="ltr"
                {...register(`imageUrl`)}
                placeholder="/images/product.png"
                className="textField__input textField__input--2 rounded-2xl w-full"
              />
            </div>
          </div>
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
