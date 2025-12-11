import { toPersianNumbers } from "@/utils/toPersianNumbers";

function ProfileInfo() {
  return (
    <div className="w-full border md:border-[1.5px] border-stroke rounded-2xl p-4">
      <div className="flex items-center justify-between w-full pb-4">
        <p className="text-sm md:text-base text-text">اطلاعات کاربری</p>
        <button className="text-primary hover:text-text active:text-text duration-200">
          ویرایش اطلاعات
        </button>
      </div>
      <div className="flex max-md:flex-col max-md:justify-center md:justify-between md:items-center border-t border-stroke pt-4 max-md:gap-6">
        {/* <InfoSections
          titleOne="نام و نام خانوادگی :"
          desOne="رضا جنیدی"
          titleTwo="کد ملی :"
          desTwo={toPersianNumbers("0123456789")}
        />
        <InfoSections
          border={true}
          titleOne="شماره موبایل :"
          desOne={toPersianNumbers("09180522273")}
          titleTwo="تلفن ثابت :"
          desTwo={toPersianNumbers("091-3564842")}
        />
        <InfoSections
          border={true}
          titleOne="تاریخ تولد  :"
          desOne={"1381/04/12"}
          titleTwo="ایمیل :"
          desTwo="RezaJoneidi@gmail.com"
        /> */}
      </div>
    </div>
  );
}

export default ProfileInfo;

function InfoSections({ border, titleOne, desOne, titleTwo, desTwo }) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-6 md:gap-10 md:py-2 w-full ${
        border && " md:border-r border-stroke md:pr-10"
      }`}
    >
      <span className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2 w-full">
        <p className="text-sm md:text-base text-text md:text-text-secondary">
          {titleOne}
        </p>
        <p className="text-sm text-text">{desOne}</p>
      </span>
      <span className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-2 w-full">
        <p className="text-sm md:text-base text-text md:text-text-secondary">
          {titleTwo}
        </p>
        <p className="text-sm text-text">{desTwo}</p>
      </span>
    </div>
  );
}
