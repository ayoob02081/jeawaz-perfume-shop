"use client";

import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRemoveCategory } from "@/hooks/useCategories";
import RHFTextField from "@/ui/RHFTextField";
import RHFRadioButton from "@/ui/RHFRadioButton";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useAddCategory from "../categories/useCreateCategory";
import useEditCategory from "../categories/useEditCategory";

const basicInfoData = [
  {
    id: 1,
    label: "عنوان فارسی",
    name: "title",
    placeholder: "گلی",
  },
  {
    id: 2,
    label: "عنوان انگلیسی",
    name: "value",
    placeholder: "floral",
  },
  {
    id: 2,
    label: "توضیحات",
    name: "description",
    placeholder: "رایحه گلی",
  },
];

const typesData = [
  {
    id: 1,
    value: "accord",
    description: "رایحه",
  },
  {
    id: 2,
    value: "gender",
    description: "جنسیت",
  },
];

function CategoryForm({ categoryToEdit }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { id, title, value, description, imageUrl, iconUrl, type } =
    categoryToEdit || {};

  const { isDeleting, removeCategory } = useRemoveCategory();

  const removeCategoryHandler = async (category) => {
    const { id, title } = category;
    try {
      await removeCategory(id);
      toast.success(`${title} با موفقیت حذف شد.`);
      queryClient.invalidateQueries(["categories"]);
      router.back();
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const { AddCategory, isAdding } = useAddCategory();
  const { editCategory, isEditing } = useEditCategory(id);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: title || "",
      value: value || "",
      description: description || "",
      imageUrl: imageUrl || "",
      iconUrl: iconUrl || "",
      type: type || "",
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
        toast.success("Category Created");
        router.back();
      } catch (error) {
        toast.error("Category Not Created");
      }
    }

    if (!!categoryToEdit) {
      try {
        editCategory(payload);
        toast.success("Category Updated");
        router.back();
      } catch (error) {
        toast.error("Category Not Updated");
        console.log(error);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-10">
      <Toaster />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {basicInfoData.map((item) => (
            <RHFTextField
              key={item.name}
              register={register}
              isRequired
              label={item.label}
              name={item.name}
              className="textField__input textField__input--2 rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder={`مثال: ${item.placeholder}`}
            />
          ))}
        </div>

        {/* IconUrl */}
        <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-text font-bold">
              آیکون دسته‌بندی
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
            <h3 className="text-text font-bold">
              عکس‌ دسته‌بندی
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

        {/* Type */}
        <div>
          <h3 className="font-bold ">
            انتخاب نوع
            <span className="text-error">*</span>
          </h3>
          <div className="flex  max-sm:flex-co max-[29rem]:flex-wrap items-center justify-center sm:justify-start sm: gap-4 w-full">
            {typesData.map((type) => {
              const isChecked = watch("type") === type.value ? true : false;
              return (
                <RHFRadioButton
                  key={type.id}
                  className=""
                  checked={isChecked}
                  value={type.value}
                  validationSchema={{ required: true }}
                  name="type"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center text-lg border-2 duration-200 ${isChecked ? " border-primary text-primary font-bold" : "text-text-secondary border-secondary opacity-70"} px-2 h-12 w-32 rounded-full `}
                  >
                    <p className="duration-200">{type.description}</p>
                  </div>
                </RHFRadioButton>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center md:items-end flex-col max-md:gap-8 md:gap-6">
          <div className="flex items-center justify-between max-sm:flex-col gap-4 w-full">
            <button
              disabled={isSubmitting || isEditing}
              className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {!categoryToEdit
                ? isSubmitting
                  ? "در حال ساخت..."
                  : "ساخت دسته‌بندی"
                : isEditing
                  ? "در حال ویرایش..."
                  : "ویرایش دسته‌بندی"}
            </button>
            <button
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>
          {categoryToEdit && (
            <button
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
