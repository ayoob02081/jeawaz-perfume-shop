"use client";

import CheckBox from "@/ui/CheckBox";
import RHFSelect from "@/ui/RHFSelect";
import RHFTextAreaField from "@/ui/RHFTextAreaField";
import RHFTextField from "@/ui/RHFTextField";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";
const { shahr, ostan } = require("iran-cities-json");

function AddressForm({
  register,
  control,
  errors,
  watch,
  reset,
  onChange,
  isChecked,
  checkBoxName,
  checkBoxLabel,
  checkBoxId,
  checkout,
  setIsListOpen,
}) {
  const selectedOstanId = watch("ostan");

  const ostanOptions = useMemo(
    () => ostan.map((o) => ({ label: o.name, value: o.name })),
    [],
  );

  const cityOptions = useMemo(() => {
    const selectedProvince = watch("ostan");
    if (!selectedProvince) return [];

    return shahr
      .filter(
        (c) => c.ostan === ostan.find((o) => o.name === selectedProvince)?.id,
      )
      .map((c) => ({ label: c.name, value: c.name }));
  }, [watch("ostan")]);

  return (
    <div className="flex flex-col gap-6 w-full ">
      <div className="flex flex-col gap-6 w-full">
        <p className="max-md:text-sm md:text-base font-bold text-stroke-800">
          اطلاعات تحویل گیرنده
        </p>
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          <RHFTextField
            isRequired
            register={register}
            errors={errors}
            label="نام و نام خانوادگی"
            name="fullName"
            className="w-full"
            placeholder="مثال : رضا جنیدی"
            validationSchema={{
              required: "نام گیرنده الزامی است",
            }}
          />
          <RHFTextField
            name="phoneNumber"
            type="tel"
            label="شماره تماس گیرنده"
            isRequired
            errors={errors}
            control={control}
            isPrice={false}
            className="w-full"
            placeholder="مثال : ۰۹۱۲۳۴۵۶۷۸۹"
            validationSchema={{
              required: "شماره تلفن الزامی است",
              pattern: {
                value: /^(?:\+98|98|0)?9\d{9}$/,
                message: "شماره موبایل نامعتبر است",
              },
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <span className="flex items-center justify-between w-full">
          <p className="max-md:text-sm md:text-base font-bold text-stroke-800">
            آدرس تحویل
          </p>
          {checkout && (
            <button
              type="button"
              onClick={() => setIsListOpen(true)}
              className="flex items-center justify-center gap-1"
            >
              <PlusIcon className="size-4 text-primary" />
              <p className="text-primary text-xs font-bold">انتخاب آدرس</p>
            </button>
          )}
        </span>
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <RHFSelect
              isRequired
              label="استان"
              name="ostan"
              className="textField__input"
              register={register}
              errors={errors}
              options={ostanOptions}
              placeholder="انتخاب استان"
            />
            <RHFSelect
              isRequired
              label="شهر"
              name="shahr"
              register={register}
              errors={errors}
              disabled={!selectedOstanId}
              options={cityOptions}
              placeholder={
                selectedOstanId ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"
              }
              className="textField__input"
            />
          </div>
          <div className="flex flex-col lg:flex-row w-full gap-4">
            <RHFTextField
              type="tel"
              label="کدپستی"
              name="postalCode"
              isRequired
              errors={errors}
              control={control}
              isPrice={false}
              className="w-full"
              placeholder="مثال : ۳۲۱۲۵۶۳۷۴۹۰"
              validationSchema={{
                required: "کدپستی الزامی است",
              }}
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <RHFTextAreaField
              label="نشانی پستی"
              name="addressLine"
              isRequired
              errors={errors}
              register={register}
              placeholder=" مثال : خیابان ولیعصر، منطقه ۱۲، بلوار کاوه، کوچه ابوذر، پلاک ۱۵"
              validationSchema={{ required: "نشانی ضروری است" }}
              className="rounded-2xl w-full"
            />

            <CheckBox
              name={checkBoxName}
              id={checkBoxId}
              value={checkBoxId}
              onChange={onChange}
              checked={isChecked}
              label={checkBoxLabel}
              className="flex flex-row items-center justify-start gap-2 cursor-pointer duration-200 w-full"
              textClassName="text-sm"
            >
              <div
                className={`flex items-center justify-center size-4.5 aspect-square rounded-sm border-[1.5px] ${isChecked ? "bg-primary has-checked: border-primary" : "border-stroke-600/50"} `}
              >
                <CheckIcon className="size-3 stroke-4 text-stroke-0" />
              </div>
            </CheckBox>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddressForm;
