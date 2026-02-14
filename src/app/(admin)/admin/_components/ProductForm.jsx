"use client";

import toast, { Toaster } from "react-hot-toast";
import { useForm, useFieldArray } from "react-hook-form";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import RHFTextField from "@/ui/RHFTextField";
import RHFTextAreaField from "@/ui/RHFTextAreaField";
import RHFRadioButton from "@/ui/RHFRadioButton";
import ImageFrame from "@/components/ImageFrame";
import RHFCheckBox from "@/ui/RHFCheckBox";
import useAddProduct from "../products/useCreatePost";

const basicInfoData = [
  {
    id: 1,
    label: "عنوان فارسی",
    name: "perTitle",
    placeholder: "بلو شنل",
  },
  {
    id: 2,
    label: "عنوان انگلیسی",
    name: "enTitle",
    placeholder: "Blue Channel",
  },
  {
    id: 3,
    label: "موجودی محصول(بر حسب میل)",
    name: "stock",
    placeholder: "۳۰۰",
  },
  {
    id: 4,
    label: "مقدار تخفیف(بر حسب درصد)",
    name: "offValue",
    placeholder: "۵",
  },
];

const notesData = [
  {
    id: 1,
    value: "top",
    description: "نت‌های اولیه",
  },
  {
    id: 2,
    value: "middle",
    description: "نت‌های میانی",
  },
  {
    id: 3,
    value: "base",
    description: "نت‌های پایانی",
  },
];

const detailInfoData = [
  {
    id: 1,
    label: "سازنده",
    name: "details.madeIn",
    placeholder: "امارات",
  },
  {
    id: 2,
    label: "طراح",
    name: "details.designedIn",
    placeholder: "آلمان",
  },
  {
    id: 3,
    label: "ماندگاری",
    name: "details.longevity",
    placeholder: "۸ ساعت",
  },
  {
    id: 4,
    label: "پخش بو",
    name: "details.smelling",
    placeholder: "۵ ساعت یا قوی",
  },
];

function ProductForm({ productToEdit }) {
  const {
    data: brands,
    isLoading: brandsLoading,
    error: brandsError,
  } = useGetAllBrandCategories();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetAllCategories();

  const { AddProduct, isAdding } = useAddProduct();

  const seasons = ["بهار", "تابستان", "پاییز", "زمستان"];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      images: [""],
      notes: { top: [""], middle: [""], base: [""] },
      modes: {
        decant: { pricePerMl: "", availableVolumes: [""] },
        sealed: { variants: [{ volume: "", price: "" }] },
      },
      details: { seasons: [""] },
      accordIds: [],
    },
  });

  const sealedFields = useFieldArray({
    control,
    name: "modes.sealed.variants",
  });

  const imageFields = useFieldArray({
    control,
    name: "images",
  });

  const genderCategories = categories?.filter((c) => c.type === "gender");
  const accordCategories = categories?.filter((c) => c.type === "accord");

  const onSubmit = async (data) => {
    const payload = {
      enTitle: data.enTitle,
      perTitle: data.perTitle,
      stock: Number(data.stock),
      original: !!data.original,
      offValue: Number(data.offValue),
      images: data.images.filter(Boolean),
      description: data.description,

      notes: {
        top: data.notes.top.filter(Boolean),
        middle: data.notes.middle.filter(Boolean),
        base: data.notes.base.filter(Boolean),
      },

      modes: {
        decant: {
          pricePerMl: Number(data?.modes.decant.pricePerMl),
          availableVolumes: data.modes.decant.availableVolumes
            .split(",")
            .map((volume) => Number(volume.trim())),
        },
        sealed: {
          variants: data.modes.sealed.variants.map((v) => ({
            volume: Number(v.volume),
            price: Number(v.price),
          })),
        },
      },

      details: {
        madeIn: data.details.madeIn,
        designedIn: data.details.designedIn,
        longevity: data.details.longevity,
        smelling: data.details.smelling,
        seasons: data.details.seasons || [],
      },

      brandId: Number(data.brandId),
      categoryIds: [Number(data.genderId), ...data.accordIds.map(Number)],
    };
    try {
      await AddProduct(payload);
      toast.success("Product Created");
    } catch (error) {
      toast.error("Product Not Created");
    }
  };

  if (brandsLoading || categoriesLoading) {
    return <Loading />;
  }
  if (brandsError || categoriesError) {
    return <Error />;
  }

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
        <RHFTextAreaField
          name="description"
          isRequired
          label="توضیحات محصول"
          register={register}
          placeholder="توضیحات محصول"
          validationSchema={{ required: true }}
          className="textField__input textField__input--2 rounded-2xl w-full"
        />

        {/* Original */}

        <RHFCheckBox
          value="original"
          id="original"
          name="original"
          register={register}
        >
          <div
            className={`flex items-center justify-center border-2 ${watch("original") === "original" ? " border-primary font-bold text-primary " : "border-secondary text-text-secondary opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
          >
            <p className="text-xl">اورجینال</p>
          </div>
        </RHFCheckBox>

        {/* Images */}
        <div className="flex flex-col items-start justify-center space-y-4 text-sm size-full">
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-text font-bold">
              عکس‌های محصول
              <span className="text-error">*</span>
            </h3>
            <button
              type="button"
              onClick={() => imageFields.append("")}
              className="btn btn--success text-sm py-1.5 px-2.5 rounded-xl"
            >
              اضافه کردن عکس
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-4">
            {imageFields.fields.map((field, i) => (
              <div
                key={field.id}
                className="flex items-center justify-start gap-2 mb-2 h-full"
              >
                <input
                  dir="ltr"
                  {...register(`images.${i}`)}
                  placeholder="/images/product.jpg"
                  className="textField__input textField__input--2 rounded-2xl w-full"
                />
                <button
                  type="button"
                  onClick={() => imageFields.remove(i)}
                  className="flex items-center justify-center bg-primary text-white text-xl py-1 px-3 h-full rounded-full"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div>
          <h3 className="font-bold mb-4">
            انتخاب برند
            <span className="text-error">*</span>
          </h3>
          <div className="flex items-start justify-start flex-wrap gap-x-4 h-64 w-full overflow-auto scrollbar--primary scrollbar-w-1.5">
            {brands.map((brand) => {
              const isChecked =
                Number(watch("brandId")) === brand.id ? true : false;
              return (
                <RHFRadioButton
                  key={brand.id}
                  className={"text-text-secondary"}
                  checked={isChecked}
                  value={brand.id}
                  validationSchema={{ required: true }}
                  name="brandId"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center ${isChecked ? "border-2 border-primary" : "opacity-70"} px-2 h-10 lg:h-12 w-32 rounded-full duration-200 `}
                  >
                    <ImageFrame
                      className="size-full"
                      src={brand.iconUrl}
                      alt={brand.value}
                    />
                  </div>
                </RHFRadioButton>
              );
            })}
          </div>
        </div>

        {/* Gender */}
        <div>
          <h3 className="font-bold ">
            انتخاب جنسیت
            <span className="text-error">*</span>
          </h3>
          <div className="flex  max-sm:flex-co max-[29rem]:flex-wrap items-center justify-center sm:justify-start sm: gap-4 w-full">
            {genderCategories.map((gender) => {
              const isChecked =
                Number(watch("genderId")) === gender.id ? true : false;
              return (
                <RHFRadioButton
                  key={gender.id}
                  className=""
                  checked={isChecked}
                  value={gender.id}
                  validationSchema={{ required: true }}
                  name="genderId"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center text-lg border-2 duration-200 ${isChecked ? " border-primary text-primary font-bold" : "text-text-secondary border-secondary opacity-70"} px-2 h-12 w-32 rounded-full `}
                  >
                    <p className="duration-200">{gender.title}</p>
                  </div>
                </RHFRadioButton>
              );
            })}
          </div>
        </div>

        {/* Accord */}
        <div>
          <h3 className="font-bold mb-4">
            انتخاب رایحه
            <span className="text-error">*</span>
          </h3>
          <div className="flex items-center justify-start flex-wrap gap-4">
            {accordCategories.map((accord) => {
              const isChecked = watch("accordIds").includes(String(accord.id))
                ? true
                : false;
              return (
                <RHFCheckBox
                  key={accord.id}
                  value={accord.id}
                  id={accord.id}
                  validationSchema={{ required: true }}
                  name="accordIds"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center border-2 ${isChecked ? "border-primary font-bold text-primary" : "border-secondary text-text-secondary opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xl">{accord.title}</p>
                      <ImageFrame
                        className="size-9"
                        src={accord.iconUrl}
                        alt={accord.value}
                      />
                    </div>
                  </div>
                </RHFCheckBox>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        {notesData.map((type) => (
          <div key={type.id}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold mb-4">
                {type.description}
                <span className="text-error">*</span>
              </h3>
              <button
                type="button"
                onClick={() => watch(`notes.${type.value}`).push("")}
                className="btn btn--success text-sm py-1.5 px-2.5 rounded-xl mb-4"
              >
                اضافه کردن نت
              </button>
            </div>
            {watch(`notes.${type.value}`).map((_, i) => (
              <div key={i} className="flex gap-3 mb-2">
                <input
                  {...register(`notes.${type.value}.${i}`)}
                  className="textField__input textField__input--2 rounded-2xl w-full"
                />
              </div>
            ))}
          </div>
        ))}

        {/* Decant */}
        <div>
          <h3 className="text-text font-bold mb-4">
            حجم‌های دکانت موجود
            <span className="text-error">*</span>
          </h3>
          <div className="flex flex-col items-start justify-start gap-4">
            <RHFTextField
              register={register}
              label="قیمت هر میل(تومان)"
              name="modes.decant.pricePerMl"
              className="textField__input textField__input--2 rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder="مثال: 34000"
            />

            <RHFTextField
              register={register}
              label="حجم‌ها"
              name="modes.decant.availableVolumes"
              className="textField__input textField__input--2 rounded-xl w-full"
              validationSchema={{ required: true }}
              placeholder="مثال: ...,3,5,10"
            />
          </div>
        </div>

        {/* Sealed Variants */}
        <div>
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-text font-bold">
              حجم‌های پلمپ موجود
              <span className="text-error">*</span>
            </h3>
            <button
              type="button"
              onClick={() => sealedFields.append({ volume: "", price: "" })}
              className="btn btn--success text-sm py-1.5 px-2.5 rounded-xl"
            >
              اضافه کردن
            </button>
          </div>
          {sealedFields.fields.map((field, i) => (
            <div key={field.id} className="flex items-end gap-4 mb-2 h-full">
              <RHFTextField
                register={register}
                name={`modes.sealed.variants.${i}.volume`}
                className="textField__input textField__input--2 rounded-xl w-full"
                validationSchema={{ required: true }}
                placeholder="حجم"
              />
              <RHFTextField
                register={register}
                name={`modes.sealed.variants.${i}.price`}
                className="textField__input textField__input--2 rounded-xl w-full"
                validationSchema={{ required: true }}
                placeholder="قیمت(تومان)"
              />

              <button
                type="button"
                onClick={() => sealedFields.remove(i)}
                className="flex items-center justify-center bg-primary text-white text-xl py-1 px-3 h-full rounded-full"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Details */}
        <div>
          <h3 className="font-bold mb-4">جزئیات محصول</h3>
          <div className="grid grid-cols-2 gap-6">
            {detailInfoData.map((item) => (
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
        </div>

        {/* Sesons */}
        <div>
          <h3 className="font-bold mb-4">
            انتخاب فصل مناسب استفاده
            <span className="text-error">*</span>
          </h3>
          <div className="flex items-center justify-center lg:justify-start flex-wrap gap-4">
            {seasons.map((season) => {
              const isChecked = watch("details.seasons").includes(season)
                ? true
                : false;
              return (
                <RHFCheckBox
                  key={season}
                  value={season}
                  id={season}
                  validationSchema={{ required: true }}
                  name="details.seasons"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center border-2 ${isChecked ? "border-primary font-bold text-primary" : "border-secondary text-text-secondary opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
                  >
                    <p className="text-xl">{season}</p>
                  </div>
                </RHFCheckBox>
              );
            })}
          </div>
        </div>

        <button
          disabled={isSubmitting}
          className="btn btn--success py-3.5 px-7 rounded-x disabled:opacity-50"
        >
          {isSubmitting ? "در حال ساخت..." : "ساخت محصول"}
        </button>
      </form>
    </div>
  );
}

export default ProductForm;
