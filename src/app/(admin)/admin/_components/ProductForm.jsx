"use client";

import toast, { Toaster } from "react-hot-toast";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  useGetAllBrandCategories,
  useGetAllCategories,
} from "@/hooks/useCategories";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import RHFTextField from "@/ui/RHFTextField";
import RHFTextAreaField from "@/ui/RHFTextAreaField";
import RHFRadioButton from "@/ui/RHFRadioButton";
import AppImage from "@/components/AppImage";
import RHFCheckBox from "@/ui/RHFCheckBox";
import useAddProduct from "../products/useCreatePost";
import useEditProduct from "../products/useEditPost";
import { useRemoveProduct } from "@/hooks/useProducts";
import { useRouter } from "next/navigation";
import findCategories from "@/utils/findCategories";
import { useEffect, useMemo } from "react";
import RHFUploadFile from "@/ui/RHFUploadFile";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { useQueryClient } from "@tanstack/react-query";

const basicInfoData = [
  { id: 1, label: "عنوان فارسی", name: "perTitle", placeholder: "بلو شنل" },
  {
    id: 2,
    label: "عنوان انگلیسی",
    name: "enTitle",
    placeholder: "Blue Channel",
  },
  {
    id: 3,
    label: "موجودی (میل)",
    name: "stock",
    placeholder: "۳۰۰",
    isNumeric: true,
    isPrice: true,
  },
  {
    id: 4,
    label: "تخفیف (%)",
    name: "offValue",
    placeholder: "۵",
    isNumeric: true,
    isPrice: true,
  },
];

const detailInfoData = [
  { id: 1, label: "سازنده", name: "details.madeIn", placeholder: "امارات" },
  { id: 2, label: "طراح", name: "details.designedIn", placeholder: "آلمان" },
  {
    id: 3,
    label: "ماندگاری",
    name: "details.longevity",
    placeholder: "۸ ساعت",
  },
  { id: 4, label: "پخش بو", name: "details.smelling", placeholder: "قوی" },
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
  const queryClient = useQueryClient();
  const router = useRouter();

  const { isDeleting, removeProduct } = useRemoveProduct();
  const { addProduct, isAdding } = useAddProduct();
  const { editProduct, isEditing } = useEditProduct(productToEdit?.id);

  const { productAccords, productBrand, productGender } = findCategories({
    product: productToEdit,
    brands,
    categories,
  });

  const genderCategories = categories?.filter((c) => c.type === "gender") || [];
  const accordCategories = categories?.filter((c) => c.type === "accord") || [];
  const seasons = ["بهار", "تابستان", "پاییز", "زمستان"];

  const initialValues = useMemo(() => {
    const existingImages =
      productToEdit?.images
        ?.filter((img) => img && img.trim() !== "")
        .map((img) => ({ url: img })) || [];
    const imagesWithEmptySlot = [...existingImages, { url: "" }];

    const volumesString = (
      productToEdit?.modes?.decant?.availableVolumes || []
    ).join(",");

    if (!productToEdit) {
      return {
        perTitle: "",
        enTitle: "",
        description: "",
        notesDescription: "",
        images: [""],
        offValue: 0,
        stock: 0,
        original: false,
        notes: {
          top: [""],
          middle: [""],
          base: [""],
        },
        modes: {
          decant: {
            pricePerMl: "",
            availableVolumes: [],
          },
          sealed: {
            variants: [{ volume: "", price: "" }],
          },
        },
        details: {
          madeIn: "",
          designedIn: "",
          longevity: "",
          smelling: "",
          seasons: [],
        },
        accordIds: [],
        genderId: null,
        brandId: null,
      };
    }

    return {
      perTitle: productToEdit?.perTitle || "",
      enTitle: productToEdit?.enTitle || "",
      description: productToEdit?.description || "",
      notesDescription: productToEdit?.notesDescription || "",
      images: imagesWithEmptySlot,
      offValue: productToEdit?.offValue || 0,
      stock: productToEdit?.stock || 0,
      original: productToEdit?.original ? "original" : false,
      notes: {
        top: productToEdit?.notes?.top?.length ? productToEdit.notes.top : [""],
        middle: productToEdit?.notes?.middle?.length
          ? productToEdit.notes.middle
          : [""],
        base: productToEdit?.notes?.base?.length
          ? productToEdit.notes.base
          : [""],
      },
      modes: {
        decant: {
          pricePerMl: productToEdit?.modes?.decant?.pricePerMl || "",
          availableVolumes: volumesString,
        },
        sealed: {
          variants: productToEdit?.modes?.sealed?.variants?.length
            ? productToEdit.modes.sealed.variants
            : [{ volume: "", price: "" }],
        },
      },
      details: {
        madeIn: productToEdit?.details?.madeIn || "",
        designedIn: productToEdit?.details?.designedIn || "",
        longevity: productToEdit?.details?.longevity || "",
        smelling: productToEdit?.details?.smelling || "",
        seasons: productToEdit?.details?.seasons || [],
      },
      accordIds: productAccords?.map((a) => String(a.id)) || [],
      genderId: productGender?.id || null,
      brandId: productBrand?.id || null,
    };
  }, [productToEdit, productAccords, productBrand, productGender]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (productToEdit) {
      reset(initialValues);
    }
  }, [productToEdit?.id, reset]);

  const {
    fields: imageFields,
    append,
    remove,
  } = useFieldArray({ control, name: "images" });

  const sealedFields = useFieldArray({
    control,
    name: "modes.sealed.variants",
  });
  const {
    fields: topFields,
    append: appendTop,
    remove: removeTop,
  } = useFieldArray({ control, name: "notes.top" });
  const {
    fields: middleFields,
    append: appendMiddle,
    remove: removeMiddle,
  } = useFieldArray({ control, name: "notes.middle" });
  const {
    fields: baseFields,
    append: appendBase,
    remove: removeBase,
  } = useFieldArray({ control, name: "notes.base" });

  const handleNoteChange = (index, name, value) => {
    const currentNotes = watch(name);
    if (index === currentNotes.length - 1 && value.trim() !== "") {
      if (name === "notes.top") appendTop("");
      if (name === "notes.middle") appendMiddle("");
      if (name === "notes.base") appendBase("");
    }
  };

  const onSubmit = async (data) => {
    const categoryIds = [
      Number(data.genderId),
      ...(data.accordIds?.map(Number) || []),
    ].filter(Boolean);

    const { genderId, accordIds, images, ...rest } = data;

    const payload = {
      ...rest,
      stock: Number(data.stock),
      offValue: Number(data.offValue),
      original: !!data.original,
      brandId: Number(data.brandId),
      categoryIds,

      images: Array.isArray(images)
        ? images
            .map((img) => (typeof img === "string" ? img : img?.url))
            .filter((url) => typeof url === "string" && url.trim() !== "")
        : [],

      notes: {
        top: data.notes?.top?.filter(Boolean) || [],
        middle: data.notes?.middle?.filter(Boolean) || [],
        base: data.notes?.base?.filter(Boolean) || [],
      },

      modes: {
        decant: {
          pricePerMl: Number(data.modes?.decant?.pricePerMl),
          availableVolumes: String(data.modes?.decant?.availableVolumes || "")
            .split(/[,،]+/)
            .map((v) => Number(v.trim()))
            .filter((v) => !isNaN(v) && v > 0),
        },
        sealed: {
          variants: (data.modes?.sealed?.variants || []).map((v) => ({
            volume: Number(v.volume),
            price: Number(v.price),
          })),
        },
      },
    };
    console.log(data);

    productToEdit ? editProduct(payload) : addProduct(payload);
  };

  const removeProductHandler = async (product) => {
    const { id, perTitle } = product;
    try {
      await removeProduct(id);
      toast.success(`${perTitle} با موفقیت حذف شد.`);
      queryClient.invalidateQueries(["products"]);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  if (brandsLoading || categoriesLoading) return <Loading />;
  if (brandsError || categoriesError) return <Error />;

  return (
    <div className="max-w-6xl mx-auto max-md:p-6 p-10">
      <Toaster />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* Basic Info */}
        <div className="flex flex-col items-start justify-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {basicInfoData.map((item) => (
              <RHFTextField
                key={item.name}
                label={item.label}
                name={item.name}
                placeholder={`مثال: ${item.placeholder}`}
                errors={errors}
                isRequired
                textClassName="font-bold"
                className="rounded-xl w-full"
                validationSchema={{ required: `${item.label} ضروری است` }}
                {...(item.isNumeric
                  ? { control, isPrice: true }
                  : { register, type: item.type || "text" })}
              />
            ))}
          </div>
          <RHFTextAreaField
            name="description"
            textClassName="font-bold"
            isRequired
            errors={errors}
            label="توضیحات محصول"
            register={register}
            placeholder="توضیحات محصول"
            validationSchema={{ required: "توضیحات محصول ضروری است" }}
            className="rounded-2xl w-full"
          />
        </div>

        {/* Images Section */}
        <div className="flex flex-col items-start gap-y-4 w-full bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
          <h3 className="text-stroke-800 font-bold text-lg">عکس‌های محصول</h3>
          <div className="flex flex-wrap gap-6">
            {imageFields.map((field, i) => (
              <Controller
                key={field.id}
                control={control}
                name={`images.${i}.url`}
                render={({ field: { onChange, value } }) => (
                  <RHFUploadFile
                    label={`انتخاب عکس ${toPersianNumbers(i + 1)}`}
                    value={value}
                    onChange={(url) => {
                      onChange(url);
                      if (url && i === imageFields.length - 1) {
                        append({ url: "" });
                      }
                    }}
                    onRemove={() => {
                      if (imageFields.length > 1) {
                        remove(i);
                      } else {
                        onChange("");
                      }
                    }}
                  />
                )}
              />
            ))}
          </div>
          {errors.images && (
            <p className="text-error text-xs">{errors.images.message}</p>
          )}
        </div>

        {/* Brand */}
        <div>
          <h3 className="font-bold text-stroke-800 max-md:text-base text-lg">
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
                  className={"text-stroke-600"}
                  checked={isChecked}
                  value={brand.id}
                  validationSchema={{ required: "انتخاب برند ضروری است!" }}
                  name="brandId"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center border-primary ${isChecked ? "border-2" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
                  >
                    <AppImage
                      width="size-full"
                      sizes="25vw"
                      ratio="aspect-[4/1]"
                      src={brand.iconUrl}
                      alt={brand.value + "-icon"}
                    />
                  </div>
                </RHFRadioButton>
              );
            })}
          </div>
          {errors?.brandId && (
            <p className="block text-error text-xs mt-2">
              {errors?.brandId?.message}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
            انتخاب جنسیت
            <span className="text-error">*</span>
          </h3>
          <div className="flex max-[29rem]:flex-wrap items-center justify-center sm:justify-start gap-4 w-full">
            {genderCategories.map((gender) => {
              const isChecked =
                Number(watch("genderId")) === gender.id ? true : false;
              return (
                <RHFRadioButton
                  key={gender.id}
                  className=""
                  checked={isChecked}
                  value={gender.id}
                  validationSchema={{ required: "انتخاب جنسیت ضروری است" }}
                  name="genderId"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center text-lg border-2 duration-200 ${isChecked ? " border-primary text-primary font-bold" : "text-stroke-600 border-stroke-150 opacity-70"} px-2 h-12 w-32 rounded-full `}
                  >
                    <p className="duration-200">{gender.title}</p>
                  </div>
                </RHFRadioButton>
              );
            })}
          </div>
          {errors?.genderId && (
            <p className="block text-error text-xs mt-2">
              {errors?.genderId?.message}
            </p>
          )}
        </div>

        {/* Original */}
        <div className="flex flex-col items-start jussta">
          <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
            اصالت
          </h3>
          <div className="flex max-[29rem]:flex-wrap items-center justify-center sm:justify-start gap-4 w-full">
            <RHFCheckBox
              value="original"
              id="original"
              name="original"
              register={register}
            >
              <div
                className={`flex items-center justify-center border-2 ${watch("original") === "original" ? " border-primary font-bold text-primary " : "border-stroke-150 text-stroke-600 opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
              >
                <p className="text-xl">اورجینال</p>
              </div>
            </RHFCheckBox>
          </div>
        </div>

        {/* Accord */}
        <div>
          <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
            انتخاب رایحه
            <span className="text-error">*</span>
          </h3>
          <div className="flex items-center max-sm:justify-center justify-start flex-wrap gap-4">
            {accordCategories.map((accord) => {
              const isChecked = watch("accordIds").includes(String(accord.id))
                ? true
                : false;
              return (
                <RHFCheckBox
                  key={accord.id}
                  value={accord.id}
                  id={accord.id}
                  validationSchema={{ required: "انتخاب رایحه ضروری است" }}
                  name="accordIds"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center border-2 ${isChecked ? "border-primary font-bold text-primary" : "border-stroke-150 text-stroke-600 opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xl">{accord.title}</p>
                      <AppImage
                        width="size-9"
                        sizes="15vw"
                        src={accord.iconUrl}
                        alt={accord.value + "-icon"}
                      />
                    </div>
                  </div>
                </RHFCheckBox>
              );
            })}
          </div>
          {errors?.accordIds && (
            <p className="block text-error text-xs mt-2">
              {errors?.accordIds?.message}
            </p>
          )}
        </div>

        {/* Notes */}

        <div className="flex flex-col gap-6">
          <RHFTextAreaField
            name="notesDescription"
            textClassName="font-bold"
            isRequired
            errors={errors}
            label="توضیحات نت ها"
            register={register}
            placeholder="توضیحات نت ها"
            validationSchema={{ required: "توضیحات نت ها ضروری است" }}
            className="rounded-2xl w-full"
          />
          <div className="flex flex-wrap items-start justify-start gap-6 w-full">
            {/* Top Notes */}
            <div className="max-sm:w-full">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
                  نت‌های اولیه
                </h3>
                <button
                  type="button"
                  onClick={() => appendTop("")}
                  className="btn btn--success text-xs py-1 px-2 rounded-lg text-nowrap"
                >
                  افزودن نت
                </button>
              </div>
              {topFields.map((field, i) => (
                <div key={field.id} className="flex gap-3 mb-2">
                  <input
                    {...register(`notes.top.${i}`)}
                    onChange={(e) => {
                      register(`notes.top.${i}`).onChange(e);
                      handleNoteChange(i, "notes.top", e.target.value);
                    }}
                    className="rounded-2xl w-full"
                  />
                  {topFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTop(i)}
                      className="flex items-center justify-center bg-primary text-stroke-0 text-xl py-1 px-3 h-full rounded-full"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Middle Notes */}
            <div className="max-sm:w-full">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
                  نت‌های میانی
                </h3>
                <button
                  type="button"
                  onClick={() => appendMiddle("")}
                  className="btn btn--success text-xs py-1 px-2 rounded-lg"
                >
                  افزودن نت
                </button>
              </div>
              {middleFields.map((field, i) => (
                <div key={field.id} className="flex gap-3 mb-2">
                  <input
                    {...register(`notes.middle.${i}`)}
                    onChange={(e) => {
                      register(`notes.middle.${i}`).onChange(e);
                      handleNoteChange(i, "notes.middle", e.target.value);
                    }}
                    className="rounded-2xl w-full"
                  />
                  {middleFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMiddle(i)}
                      className="flex items-center justify-center bg-primary text-stroke-0 text-xl py-1 px-3 h-full rounded-full"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Base Notes */}
            <div className="max-sm:w-full">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
                  نت‌های پایانی
                </h3>
                <button
                  type="button"
                  onClick={() => appendBase("")}
                  className="btn btn--success text-xs py-1 px-2 rounded-lg"
                >
                  افزودن نت
                </button>
              </div>
              {baseFields.map((field, i) => (
                <div key={field.id} className="flex gap-3 mb-2">
                  <input
                    {...register(`notes.base.${i}`)}
                    onChange={(e) => {
                      register(`notes.base.${i}`).onChange(e);
                      handleNoteChange(i, "notes.base", e.target.value);
                    }}
                    className="rounded-2xl w-full"
                  />
                  {baseFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBase(i)}
                      className="flex items-center justify-center bg-primary text-stroke-0 text-xl py-1 px-3 h-full rounded-full"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decant */}
        <div>
          <h3 className="text-stroke-800 font-bold mb-4">
            حجم‌های دکانت موجود
            <span className="text-error">*</span>
          </h3>
          <div className="flex flex-wra items-center justify-start gap-4 w-full">
            <RHFTextField
              textClassName="font-bold"
              errors={errors}
              control={control}
              isPrice={true}
              label="قیمت هر میل(تومان)"
              name="modes.decant.pricePerMl"
              className="rounded-xl w-full"
              validationSchema={{ required: "قیمت هر میل ضروری است" }}
              placeholder="مثال: ۳۴,۰۰۰"
            />
            <RHFTextField
              textClassName="font-bold"
              register={register}
              errors={errors}
              label="حجم‌ها (میلی‌لیتر)"
              name="modes.decant.availableVolumes"
              className="rounded-xl w-full"
              placeholder="مثال: 3,5,10"
              validationSchema={{
                required: "وارد کردن حجم‌ دکانت ها ضروری است",
                pattern: {
                  value: /^[\d,]+$/,
                  message: "فقط عدد انگلیسی و کاما وارد کنید",
                },
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/[^0-9,]/g, "");
                },
              }}
            />
          </div>
        </div>

        {/* Sealed Variants */}
        <div>
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-stroke-800 font-bold">
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
                errors={errors}
                textClassName="font-bold"
                control={control}
                isPrice={true}
                name={`modes.sealed.variants.${i}.volume`}
                className="rounded-xl w-full"
                validationSchema={{ required: "حجم ضروری است" }}
                placeholder="حجم"
              />
              <RHFTextField
                textClassName="font-bold"
                errors={errors}
                control={control}
                isPrice={true}
                name={`modes.sealed.variants.${i}.price`}
                className="rounded-xl w-full"
                validationSchema={{ required: "قیمت ضروری است" }}
                placeholder="قیمت(تومان)"
              />
              <button
                type="button"
                onClick={() => sealedFields.remove(i)}
                className="flex items-center justify-center bg-primary text-stroke-0 text-xl py-1 px-3 h-full rounded-full"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Details */}
        <div>
          <h3 className="font-bold mb-6 text-stroke-800 max-md:text-base text-lg">
            جزئیات محصول
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {detailInfoData.map((item) => (
              <RHFTextField
                key={item.name}
                textClassName="font-bold"
                register={register}
                isRequired
                errors={errors}
                label={item.label}
                name={item.name}
                className="rounded-xl w-full"
                validationSchema={{ required: `${item.label} ضروری است` }}
                placeholder={`مثال: ${item.placeholder}`}
              />
            ))}
          </div>
        </div>

        {/* Sesons */}
        <div>
          <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
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
                  validationSchema={{ required: "انتخاب فصل ضروری است" }}
                  name="details.seasons"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center border-2 ${isChecked ? "border-primary font-bold text-primary" : "border-stroke-150 text-stroke-600 opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
                  >
                    <p className="text-xl">{season}</p>
                  </div>
                </RHFCheckBox>
              );
            })}
          </div>
          {errors?.details?.seasons && (
            <p className="block text-error text-xs mt-2">
              {errors?.details?.seasons?.message}
            </p>
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
              {!productToEdit
                ? isSubmitting
                  ? "در حال ساخت..."
                  : "ساخت محصول"
                : isEditing
                  ? "در حال ویرایش..."
                  : "ویرایش محصول"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              بازگشت
            </button>
          </div>
          {productToEdit && (
            <button
              type="button"
              disabled={isDeleting || isAdding || isEditing || isSubmitting}
              onClick={() => removeProductHandler(productToEdit)}
              className="btn btn--primary border-0 py-3.5 px-7 rounded-x disabled:opacity-50 max-md:w-full md:w-44"
            >
              {isDeleting ? "در حال حذف..." : "حذف محصول"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
