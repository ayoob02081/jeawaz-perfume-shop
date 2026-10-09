"use client";
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
import { useEffect, useMemo, useRef } from "react";
import RHFUploadFile from "@/ui/RHFUploadFile";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  buildProductFormPayload,
  concentrationOptions,
  gradeOptions,
  initialProductFormValues,
  longevityOptions,
  PRINT_NAME_MAX,
  projectionOptions,
  sillageOptions,
  variantTypes,
} from "./productFormContract";
import { runProductDelete } from "./productDeleteContract.mjs";
import ActionButtons from "../../_components/ActionButtons";
import { gradeLabel } from "@/utils/productGrade.mjs";
import Link from "next/link";

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
  {
    type: "fragrance_family",
    field: "fragranceFamilyIds",
    label: "خانوادهٔ بویایی",
  },
  { type: "season", field: "seasonIds", label: "فصل" },
  { type: "character", field: "characterIds", label: "شخصیت رایحه" },
  { type: "occasion", field: "occasionIds", label: "موقعیت استفاده" },
];

// Modes: edit (`productToEdit`) PATCHes that Product. Create — blank, or a
// duplicate prefilled from `cloneDefaults` (form values built by
// mapProductToCloneDefaults) with `copySource` for the banner — always POSTs a
// new Product; a duplicate never passes its source as `productToEdit`.
function ProductForm({ productToEdit, cloneDefaults, copySource }) {
  // Keep the edit baseline from when this Product was opened, even if a query
  // refreshes while the admin is editing. The backend compares it under lock.
  const editBaseline = useRef({
    id: productToEdit?.id,
    variants: productToEdit?.variants?.map(({ type, volume, price }) => ({
      type,
      volume,
      price,
    })),
  });
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

  const { isDeleting, removeProduct } = useRemoveProduct();
  const { addProduct, isAdding } = useAddProduct();
  const { editProduct, isEditing } = useEditProduct(productToEdit?.id);

  const genderCategories = categories?.filter((c) => c.type === "gender") || [];
  const temperatureCategories =
    categories?.filter((c) => c.type === "temperature") || [];
  const initialValues = useMemo(
    () =>
      productToEdit
        ? initialProductFormValues(productToEdit)
        : (cloneDefaults ?? initialProductFormValues()),
    [productToEdit, cloneDefaults],
  );
  // One create/update request at a time: the mutation's pending flag reaches
  // the button only after a re-render, so a fast double click needs this lock.
  const submitLock = useRef(false);

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
      editBaseline.current = {
        id: productToEdit.id,
        variants: productToEdit.variants?.map(({ type, volume, price }) => ({
          type,
          volume,
          price,
        })),
      };
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
      data,
      productToEdit ? editBaseline.current.variants : undefined,
    );
    if (payloadErrors.length) {
      payloadErrors.forEach(({ field, message }) =>
        setError(field, { type: "validate", message }),
      );
      return;
    }

    if (submitLock.current || isAdding || isEditing) return;
    submitLock.current = true;
    const release = {
      onSettled: () => {
        submitLock.current = false;
      },
    };
    productToEdit ? editProduct(payload, release) : addProduct(payload, release);
  };

  const removeProductHandler = async (product) => {
    await runProductDelete({ id: product.id, removeProduct });
  };

  if (brandsLoading || categoriesLoading) return <Loading />;
  if (brandsError || categoriesError) return <Error />;

  return (
    <div className="max-w-6xl px-4 w-full">
      {copySource && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 mb-8 p-4 rounded-2xl border border-blue bg-blue/10 text-sm text-stroke-800"
        >
          <div className="flex flex-col gap-1">
            <p className="font-bold">
              در حال ساخت محصول جدید بر اساس «{copySource.title}»
            </p>
            <p className="text-stroke-600">
              منبع: {gradeLabel(copySource.grade) || "نامشخص"} — محصول منبع
              تغییر نمی‌کند. نوع کیفیت، قیمت‌ها، موجودی و تخفیف محصول جدید را
              وارد کنید.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/products/${copySource.id}`}
              target="_blank"
              className="btn border py-1.5 px-3"
            >
              مشاهده محصول منبع
            </Link>
            <Link
              href="/admin/products/add"
              prefetch={false}
              className="btn border py-1.5 px-3"
            >
              شروع محصول خالی
            </Link>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-12">
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
              control={control}
              type="tel"
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
            {/* Admin-only label for order Excel/print; enTitle is only the
                placeholder and is never written into the field. */}
            <div className="flex flex-col gap-1 w-full md:col-span-2">
              <RHFTextField
                label="نام کوتاه برای چاپ"
                name="printName"
                register={register}
                errors={errors}
                dir="auto"
                maxLength={PRINT_NAME_MAX}
                placeholder={watch("enTitle") || "نام انگلیسی محصول"}
              />
              <p className="text-xs text-stroke-600 mr-2">
                اختیاری؛ در صورت خالی بودن، نام انگلیسی محصول استفاده می‌شود.
              </p>
              {copySource && (
                <p className="text-xs font-bold text-stroke-800 bg-warning/20 rounded-lg px-2 py-1 mr-2 w-fit">
                  از محصول منبع کپی شده است؛ بازبینی کنید تا در خروجی اکسل و
                  چاپ با محصول منبع یکسان نباشد.
                </p>
              )}
            </div>
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
            className="rounded-2xl w-full scrollbar-none"
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
          <div className="flex items-start justify-center flex-wrap gap-6 h-64 w-full overflow-auto scrollbar-none">
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

        {/* Grade: required, no default (a new Product starts unselected) */}
        <div>
          <h3 className="font-bold mb-4 text-stroke-800 max-md:text-base text-lg">
            نوع کیفیت
            <span className="text-error">*</span>
          </h3>
          <div className="flex max-[29rem]:flex-wrap items-center justify-center sm:justify-start gap-4 w-full">
            {gradeOptions.map((grade) => {
              const isChecked = watch("grade") === grade;
              return (
                <RHFRadioButton
                  key={grade}
                  id={`grade-${grade}`}
                  checked={isChecked}
                  value={grade}
                  validationSchema={{ required: "انتخاب نوع کیفیت ضروری است" }}
                  name="grade"
                  register={register}
                >
                  <div
                    className={`flex items-center justify-center text-lg border-2 duration-200 ${isChecked ? " border-primary text-primary bg-stroke-0 font-bold" : "text-stroke-600 border-stroke-150 opacity-70"} px-2 h-12 w-32 rounded-full `}
                  >
                    <p className="duration-200">{gradeLabel(grade)}</p>
                  </div>
                </RHFRadioButton>
              );
            })}
          </div>
          <FieldError error={errors.grade} />
        </div>

        {multipleCategoryFields.map(({ type, field, label }) => (
          <div key={type}>
            <h3 className="font-bold mb-4 text-stroke-800 text-lg">{label}</h3>
            <div className="flex flex-wrap gap-4">
              {categories
                .filter((category) => category.type === type)
                .map((category) => {
                  const selected = (watch(field) || []).includes(
                    String(category.id),
                  );
                  return (
                    <RHFCheckBox
                      key={category.id}
                      value={category.id}
                      id={`${field}-${category.id}`}
                      name={field}
                      register={register}
                      disabled={!category.isActive && !selected}
                    >
                      <div
                        className={`flex items-center justify-between gap-2 md:gap-3 border-2 rounded-full px-4 py-2 ${selected ? "border-primary text-primary" : "border-stroke-150 text-stroke-600"} transition-all duration-200`}
                      >
                        {category.title}
                        {!category.isActive && " (غیرفعال)"}
                        <AppImage
                          src={category?.iconUrl}
                          alt="icon"
                          sizes="10vw"
                          width="w-8 md:w-10"
                        />
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
            disabled:
              !category.isActive &&
              String(category.id) !== String(watch("temperatureId")),
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
            className="rounded-2xl w-full scrollbar-none"
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
            <h3 className="font-bold text-stroke-800">
              گونه‌ها و قیمت‌های مستقل
            </h3>
            <button
              type="button"
              onClick={() =>
                variantFields.append({ type: "decant", volume: "", price: "" })
              }
              className="btn btn--success text-sm py-1.5 px-2.5"
            >
              افزودن گونه
            </button>
          </div>
          <FieldError error={errors.variants} />
          {variantFields.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col md:flex-row items-end gap-4 mb-4"
            >
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
              control={control}
              type="tel"
              min="0"
              max="168"
              register={register}
              errors={errors}
            />
            <RHFTextField
              label="حداکثر ساعت ماندگاری"
              name="performance.longevity.maxHours"
              control={control}
              type="tel"
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

        {/* Action Buttons */}
        <ActionButtons
          confurmLabel={
            !productToEdit
              ? isSubmitting || isAdding
                ? "در حال ساخت..."
                : "ساخت محصول"
              : isEditing
                ? "در حال ویرایش..."
                : "ویرایش محصول"
          }
          isPending={isSubmitting || isAdding || isEditing}
        />
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
      <select
        {...register(name)}
        className="textField__input rounded-5xl w-full"
      >
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
