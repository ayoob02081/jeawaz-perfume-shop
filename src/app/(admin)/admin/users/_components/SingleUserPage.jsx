import Error from "@/components/Error";
import Loading from "@/components/Loading";
import { useGetUserById } from "@/hooks/useUsers";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  normalizeIranPhone,
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import Link from "next/link";

function SingleUserPage({ userId }) {
  const { data: user, isLoading, error } = useGetUserById(userId);

  const {
    fullName,
    role,
    phoneNumber,
    email,
    accountStatus,
    birthday,
    createdAt,
    updatedAt,
    nationalCode,
    addressesCount,
    ordersCount,
    totalSpent,
    totalPurchases,
    lastLogin,
  } = user || {};

  const infoData = [
    { id: 1, title: "نام و نام خانوادگی :", des: fullName },
    {
      id: 2,
      title: "شماره موبایل :",
      des: normalizeIranPhone(phoneNumber),
    },
    { id: 3, title: "نقش :", des: role ? "ادمین" : "کاربر" },
    {
      id: 4,
      title: "وضعیت :",
      des: accountStatus ? "فعال" : "غیر فعال",
      className: accountStatus ? "text-success" : "text-orange",
    },
    {
      id: 5,
      title: "کد ملی :",
      des: nationalCode ? toPersianNumbers(nationalCode) : "-",
    },
    { id: 6, title: "ایمیل :", des: email ? email : "-" },
    { id: 7, title: "تاریخ ثبت‌نام :", des: toLocalDateString(createdAt) },
    {
      id: 8,
      title: "آخرین ورود :",
      des: lastLogin
        ? toLocalDateString(lastLogin)
        : toLocalDateString(createdAt),
    },
  ];
  const infoButtonsData = [
    {
      id: 1,
      title: "تعداد آدرس ها :",
      des: toPersianNumbers(addressesCount),
      page: "/addresses",
    },

    {
      id: 2,
      title: "تعداد سفارشات :",
      des: toPersianNumbers(ordersCount),
      page: "/purchases",
    },
    {
      id: 3,
      title: "تعداد محصولات خریداری شده :",
      des: toPersianNumbersWithComma(totalPurchases),
      page: "/purchases",
    },
    {
      id: 4,
      title: "جمع مبالغ پرداخت شده :",
      des: toPersianNumbersWithComma(totalSpent),
      page: "/purchases",
      className: "text-2xl text-blue",
    },
  ];

  if (isLoading) return <Loading />;

  if (error) return <Error />;

  return (
    <div className="w-full p-4 pt-0">
      <div className="flex flex-wrap gap-4 justify-center w-full border-stroke-200 max-md:gap-6 pt-4 lg: border lg: p-4 lg: rounded-2xl">
        {infoData?.map((item) => (
          <span
            key={item.id}
            className={`flex items-center justify-between border-b border-stroke-300 pb-4 w-full`}
          >
            <p className="text-base text-stroke-800 md:text-stroke-600">
              {item.title}
            </p>
            <p className={`font-bold text-stroke-800  ${item.className}`}>
              {item.des}
            </p>
          </span>
        ))}
        {infoButtonsData?.map((item) => (
          <Link
            key={item.id}
            href={`/admin/users/${userId}${item.page}`}
            className="fex flex-col items-ceter justify-betwen btn bg-stroke-100 border border-stroke-100 hover:border-primary hadow-stroke-800/40 rounded-2xl p-6 gap-2 shrink grow transition-all duration-200"
          >
            <p className="text-base text-stroke-800 md:text-stroke-600">
              {item.title}
            </p>
            <p className={`font-bold  ${item.className}`}>{item.des}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SingleUserPage;
