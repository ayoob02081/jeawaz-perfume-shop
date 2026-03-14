"use client";

import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRemoveBrand } from "@/hooks/useCategories";
import RHFTextField from "@/ui/RHFTextField";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import useAddBrand from "../categories/useCreateBrand";
import useEditBrand from "../categories/useEditBrand";

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
  const queryClient = useQueryClient();
  const router = useRouter();

  const { id, title, value, iconUrl, description } = brandToEdit || {};

  const { isDeleting, removeBrand } = useRemoveBrand();

  const removeCategoryHandler = async (category) => {
    const { id, title } = category;
    try {
      await removeBrand(id);
      toast.success(`${title} با موفقیت حذف شد.`);
      queryClient.invalidateQueries(["brands"]);
      router.back();
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const { AddBrand, isAdding } = useAddBrand();
  const { editBrand, isEditing } = useEditBrand(id);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
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
      try {
        await AddBrand(payload);
        toast.success(`برند ${data.title} با موفقیت ساخته شد`);
        queryClient.invalidateQueries(["brands"]);
        router.back();
      } catch (error) {
        toast.error(`ساخت برند با خطا مواجه شد`);
      }
    }

    if (!!brandToEdit) {
      try {
        await editBrand(payload);
        toast.success(`برند ${data.title} با موفقیت ویرایش شد`);
        queryClient.invalidateQueries(["brands"]);
        router.back();
      } catch (error) {
        toast.error(`ویرایش برند ${data.title} با خطا مواجه شد`);
        console.log(error);
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
            <h3 className="text-text font-bold max-md:text-base text-lg">
              آیکون برند
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
