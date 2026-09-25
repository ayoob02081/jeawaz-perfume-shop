"use client";

import { Toaster } from "react-hot-toast";
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
import {
  useAddProduct,
  useEditProduct,
  useRemoveProduct,
} from "@/hooks/useProducts";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import RHFUploadFile from "@/ui/RHFUploadFile";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  buildProductFormPayload,
  concentrationOptions,
  initialProductFormValues,
  longevityOptions,
  projectionOptions,
  sillageOptions,
  variantTypes,
} from "./productFormContract";
import { runProductDelete } from "./productDeleteContract.mjs";

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

const multipleCategoryFields = [
  { type: "fragrance_family", field: "fragranceFamilyIds", label: "خانوادهٔ بویایی" },
  { type: "season", field: "seasonIds", label: "فصل" },
  { type: "character", field: "characterIds", label: "شخصیت رایحه" },
  { type: "occasion", field: "occasionIds", label: "موقعیت استفاده" },
];

function ProductForm({ productToEdit }) {
  // Keep the edit baseline from when this Product was opened, even if a query
  // refreshes while the admin is editing. The backend compares it under lock.
  const editBaseline = useRef({ id: productToEdit?.id,
    variants: productToEdit?.variants?.map(({ type, volume, price }) => ({ type, volume, price })) });
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
  const router = useRouter();

  const { isDeleting, removeProduct } = useRemoveProduct();
  const { addProduct, isAdding } = useAddProduct();
  const { editProduct, isEditing } = useEditProduct(productToEdit?.id);

  const genderCategories = categories?.filter((c) => c.type === "gender") || [];
  const temperatureCategories =
    categories?.filter((c) => c.type === "temperature") || [];
  const initialValues = useMemo(
    () => initialProductFormValues(productToEdit),
    [productToEdit],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (productToEdit?.id && editBaseline.current.id !== productToEdit.id) {
      editBaseline.current = { id: productToEdit.id,
        variants: productToEdit.variants?.map(({ type, volume, price }) => ({ type, volume, price })) };
      reset(initialValues);
    }
  }, [productToEdit, initialValues, reset]);

  const {
    fields: imageFields,
    append,
    remove,
  } = useFieldArray({ control, name: "images" });

  const variantFields = useFieldArray({
    control,
    name: "variants",
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

  const NotsFieldData = [
    {
      id: 1,
      label: "نت‌های اولیه",
      addField: () => appendTop(""),
      removeField: removeTop,
      noteFields: topFields,
      name: "notes.top",
    },
    {
      id: 2,
      label: "نت‌های میانی",
      addField: () => appendMiddle(""),
      removeField: removeMiddle,
      noteFields: middleFields,
      name: "notes.middle",
    },
    {
      id: 3,
      label: "نت‌های پایانی",
      addField: () => appendBase(""),
      removeField: removeBase,
      noteFields: baseFields,
      name: "notes.base",
    },
  ];

  const onSubmit = async (data) => {
    const { payload, errors: payloadErrors } = buildProductFormPayload(
      data, productToEdit ? editBaseline.current.variants : undefined,
    );
    if (payloadErrors.length) {
      payloadErrors.forEach(({ field, message }) =>
        setError(field, { type: "validate", message }),
      );
      return;
    }

    productToEdit ? editProduct(payload) : addProduct(payload);
  };

  const removeProductHandler = async (product) => {
    await runProductDelete({ id: product.id, removeProduct });
  };

  if (brandsLoading || categoriesLoading) return <Loading />;
  if (brandsError || categoriesError) return <Error />;

  return (
    <div className="max-w-6xl px-4">
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
            <RHFTextField
              label="سال عرضه"
              name="releaseYear"
              type="number"
              min="1700"
              max={new Date().getFullYear() + 1}
              register={register}
              errors={errors}
              placeholder="اختیاری"
            />
            <RHFTextField
              label="کشور تولید"
              name="country"
              register={register}
              errors={errors}
              placeholder="اختیاری"
            />
            <RHFTextField
              label="عطرساز"
              name="perfumer"
              register={register}
              errors={errors}
              placeholder="اختیاری"
            />
            <FormSelect
              label="غلظت"
              name="concentration"
              register={register}
              options={concentrationOptions}
              error={errors.concentration}
            />
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
        <div className="flex flex-col items-start gap-y-4 w-full bg-stroke-100 p-6 rounded-3xl border border-slate-100">
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
          <div className="flex items-start justify-center flex-wrap gap-6 h-64 w-full overflow-auto scrollbar--primary scrollbar-w-1.5">
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
                    className={`flex items-center justify-center border-primary ${isChecked ? "border-2 bg-stroke-0" : "opacity-70"} px-2 py-1 h-10 lg:h-12 rounded-full duration-200 `}
                  >
                    <AppImage
                      width="size-full"
                      sizes="25vw"
                      ratio="aspect-[4/1]"
                      className="dark:invert"
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
                  disabled={!gender.isActive && !isChecked}
                  validationSchema={{ required: "انتخاب جنسیت ضروری است" }}
                  name="genderId"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center text-lg border-2 duration-200 ${isChecked ? " border-primary text-primary bg-stroke-0 font-bold" : "text-stroke-600 border-stroke-150 opacity-70"} px-2 h-12 w-32 rounded-full `}
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
                className={`flex items-center justify-center border-2 ${watch("original") === "original" ? " border-primary bg-stroke-0 font-bold text-primary " : "border-stroke-150 text-stroke-600 opacity-70"} px-2 h-12 w-32 rounded-full duration-200 `}
              >
                <p className="text-xl">اورجینال</p>
              </div>
            </RHFCheckBox>
          </div>
        </div>

        {multipleCategoryFields.map(({ type, field, label }) => (
          <div key={type}>
            <h3 className="font-bold mb-4 text-stroke-800 text-lg">{label}</h3>
            <div className="flex flex-wrap gap-4">
              {categories
                .filter((category) => category.type === type)
                .map((category) => {
                  const selected = (watch(field) || []).includes(String(category.id));
                  return (
                    <RHFCheckBox
                      key={category.id}
                      value={category.id}
                      id={`${field}-${category.id}`}
                      name={field}
                      register={register}
                      disabled={!category.isActive && !selected}
                    >
                      <div className={`border-2 rounded-full px-4 py-2 ${selected ? "border-primary text-primary" : "border-stroke-150 text-stroke-600"}`}>
                        {category.title}{!category.isActive && " (غیرفعال)"}
                      </div>
                    </RHFCheckBox>
                  );
                })}
            </div>
            <FieldError error={errors[field]} />
          </div>
        ))}
        <FormSelect
          label="دما"
          name="temperatureId"
          register={register}
          options={temperatureCategories.map((category) => ({
            value: category.id,
            label: `${category.title}${category.isActive ? "" : " (غیرفعال)"}`,
            disabled: !category.isActive && String(category.id) !== String(watch("temperatureId")),
          }))}
          error={errors.temperatureId}
        />

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
            {/* Notes */}
            {NotsFieldData?.map((note) => (
              <Notes
                key={note.id}
                label={note.label}
                addField={note.addField}
                removeField={note.removeField}
                noteFields={note.noteFields}
                name={note.name}
                register={register}
                handleNoteChange={handleNoteChange}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stroke-800">گونه‌ها و قیمت‌های مستقل</h3>
            <button
              type="button"
              onClick={() => variantFields.append({ type: "decant", volume: "", price: "" })}
              className="btn btn--success text-sm py-1.5 px-2.5"
            >
              افزودن گونه
            </button>
          </div>
          <FieldError error={errors.variants} />
          {variantFields.fields.map((field, index) => (
            <div key={field.id} className="flex flex-col md:flex-row items-end gap-4 mb-4">
              <FormSelect
                label="نوع"
                name={`variants.${index}.type`}
                register={register}
                options={variantTypes.map((type) => ({
                  value: type,
                  label: type === "decant" ? "دکانت" : "پلمپ",
                }))}
                error={errors.variants?.[index]?.type}
              />
              <RHFTextField
                label="حجم (میلی‌لیتر)"
                name={`variants.${index}.volume`}
                control={control}
                isPrice
                errors={errors}
                placeholder="حجم صحیح مثبت"
                validationSchema={{ required: "حجم ضروری است" }}
              />
              <RHFTextField
                label="قیمت"
                name={`variants.${index}.price`}
                control={control}
                isPrice
                errors={errors}
                placeholder="قیمت صحیح مثبت"
                validationSchema={{ required: "قیمت ضروری است" }}
              />
              <button
                type="button"
                onClick={() => variantFields.remove(index)}
                className="btn btn--primary--2 px-3 py-2"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-stroke-800">عملکرد عطر</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              label="سطح ماندگاری"
              name="performance.longevity.level"
              register={register}
              options={longevityOptions}
              error={errors.performance?.longevity?.level}
            />
            <RHFTextField
              label="حداقل ساعت ماندگاری"
              name="performance.longevity.minHours"
              type="number"
              min="0"
              max="168"
              register={register}
              errors={errors}
            />
            <RHFTextField
              label="حداکثر ساعت ماندگاری"
              name="performance.longevity.maxHours"
              type="number"
              min="0"
              max="168"
              register={register}
              errors={errors}
            />
            <FormSelect
              label="پخش بو"
              name="performance.projection"
              register={register}
              options={projectionOptions}
              error={errors.performance?.projection}
            />
            <FormSelect
              label="رد بو"
              name="performance.sillage"
              register={register}
              options={sillageOptions}
              error={errors.performance?.sillage}
            />
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
              className="btn btn--primary--2 border-2 border-primary py-3.5 px-7 disabled:opacity-50 max-md:w-full md:w-44"
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

function FieldError({ error }) {
  return error?.message ? (
    <p className="text-error text-xs mt-2">{error.message}</p>
  ) : null;
}

function FormSelect({ label, name, register, options, error }) {
  return (
    <label className="flex flex-col gap-2 w-full text-stroke-800">
      <span className="font-bold">{label}</span>
      <select {...register(name)} className="textField__input rounded-5xl w-full h-12">
        <option value="">انتخاب نشده</option>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const text = typeof option === "string" ? option : option.label;
          return (
            <option
              key={value}
              value={value}
              disabled={typeof option === "string" ? false : option.disabled}
            >
              {text}
            </option>
          );
        })}
      </select>
      <FieldError error={error} />
    </label>
  );
}

function Notes({
  label,
  addField,
  removeField,
  noteFields,
  name,
  register,
  handleNoteChange,
}) {
  return (
    <div className="w-full shrink grow">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="font-bold text-stroke-800 max-md:text-base text-lg">
          {label}
        </h3>
        <button
          type="button"
          onClick={addField}
          className="btn btn--success text-sm py-1 px-2"
        >
          افزودن نت
        </button>
      </div>
      {noteFields.map((field, i) => (
        <div
          key={field.id}
          className="relative h-full flex flex-col gap-3 mb-2"
        >
          <input
            {...register(`${name}.${i}`)}
            onChange={(e) => {
              register(`${name}.${i}`).onChange(e);
              handleNoteChange(i, name, e.target.value);
            }}
            className="textField__input rounded-5xl size-full"
          />
          {noteFields.length >= 1 && (
            <DeleteButton onClick={() => removeField(i)} />
          )}
        </div>
      ))}
    </div>
  );
}

function DeleteButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-10 top-1/2 -translate-y-1/2 left-1 flex items-center justify-center hover:bg-primary text-primary hover:text-white border border-primary text-xl h-[85%] aspect-square rounded-full transition-all duration-200"
    >
      <XMarkIcon className="size-5 stroke-3" />
    </button>
  );
}
