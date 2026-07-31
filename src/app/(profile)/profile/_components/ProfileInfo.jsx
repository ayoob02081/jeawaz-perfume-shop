"use client";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { useAuth } from "@/contexts/filters/auth/AuthContext";
import { toJalali } from "@/utils/date";
import { normalizeIranPhone, toPersianNumbers } from "@/utils/toPersianNumbers";
import Link from "next/link";

function ProfileInfo() {
  const { user, loading:isLoading } = useAuth();

  const {
    email,
    phoneNumber,
    firstName,
    lastName,
    nationalCode,
    username,
    birthday,
  } = user || {};

  if (isLoading) {
    return <Loading />;
  }

  // if (error) {
  //   return <Error />;
  // }

  return (
    <div className="w-full border md:border-[1.5px] border-stroke-200 rounded-2xl p-4 bg-stroke-0">
      <div className="flex items-center justify-between w-full pb-4">
        <p className="text-sm md:text-base text-stroke-800 font-bold">
          اطلاعات کاربری
        </p>
        <Link
          href="/profile/me/edit"
          className="text-primary hover:text-success active:text-success duration-200"
        >
          ویرایش اطلاعات
        </Link>
      </div>
      <div className="flex max-md:flex-col max-md:justify-center md:justify-between md:items-center border-t border-stroke-200 pt-4 max-md:gap-6">
        <InfoSections
          titleOne="نام و نام خانوادگی :"
          desOne={firstName + " " + lastName || "-"}
          titleTwo="کد ملی :"
          desTwo={toPersianNumbers(nationalCode) || "-"}
        />
        <InfoSections
          border={true}
          titleOne="شماره موبایل :"
          desOne={normalizeIranPhone(phoneNumber) || "-"}
          titleTwo="نام کاربری :"
          desTwo={username || "-"}
        />
        <InfoSections
          border={true}
          titleOne="تاریخ تولد  :"
          desOne={birthday ? toJalali(new Date(birthday)) : "-"}
          titleTwo="ایمیل :"
          desTwo={email || "-"}
        />
      </div>
    </div>
  );
}

export default ProfileInfo;

function InfoSections({ border, titleOne, desOne, titleTwo, desTwo }) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-6 md:gap-10 md:py-2 w-full ${
        border && " md:border-r border-stroke-200 md:pr-10"
      }`}
    >
      <span className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2 w-full">
        <p className="text-sm md:text-base text-stroke-800 md:text-stroke-600">
          {titleOne}
        </p>
        <p className="text-sm text-stroke-800">{desOne}</p>
      </span>
      <span className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2 w-full">
        <p className="text-sm md:text-base text-stroke-800 md:text-stroke-600">
          {titleTwo}
        </p>
        <p className="text-sm text-stroke-800">{desTwo}</p>
      </span>
    </div>
  );
}
