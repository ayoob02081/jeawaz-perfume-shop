"use client";

import Error from "@/components/Error";
import Loading from "@/components/Loading";
import NotExisted from "@/components/NotExisted";
import { useGetAdminContactMessage } from "@/hooks/useAdminContactMessages";
import {
  formatContactDateTime,
  getContactStatusBadge,
  isContactMessageNotFound,
} from "@/utils/adminContactMessagesContract.mjs";
import { normalizeIranPhone } from "@/utils/toPersianNumbers";
import Link from "next/link";
import ContactStatusControls from "./ContactStatusControls";

// Detail is read-only: loading it never changes the message status.
function SingleContactMessagePage({ messageId }) {
  const { data: message, isLoading, error } =
    useGetAdminContactMessage(messageId);

  if (isLoading) return <Loading />;

  if (isContactMessageNotFound(error)) {
    return (
      <div className="flex flex-col items-center gap-4 w-full p-4">
        <NotExisted className="h-60">پیام مورد نظر یافت نشد!</NotExisted>
        <BackLink />
      </div>
    );
  }

  if (error || !message) return <Error />;

  const badge = getContactStatusBadge(message.status);

  const infoData = [
    { id: 1, title: "نام و نام خانوادگی :", des: message.fullName },
    {
      id: 2,
      title: "شماره موبایل :",
      des: (
        <Link
          href={`tel:+${message.phoneNumber}`}
          className="hover:text-primary duration-200"
        >
          {normalizeIranPhone(message.phoneNumber)}
        </Link>
      ),
    },
    {
      id: 3,
      title: "وضعیت :",
      des: (
        <span className={`badge border font-bold ${badge.className}`}>
          {badge.label}
        </span>
      ),
    },
    {
      id: 4,
      title: "تاریخ دریافت :",
      des: formatContactDateTime(message.createdAt),
    },
    ...(message.readAt
      ? [
          {
            id: 5,
            title: "اولین مشاهده :",
            des: formatContactDateTime(message.readAt),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6 w-full p-4 pt-0 pb-10 lg:w-[calc(100%-88px)] 2xl:w-[calc(100%-270px)]">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-bold text-xl text-stroke-800">جزئیات پیام</h1>
        <BackLink />
      </div>
      <div className="flex flex-wrap gap-4 justify-center w-full border-stroke-200 max-md:gap-6 pt-4 lg:border lg:p-4 lg:rounded-2xl">
        {infoData.map((item) => (
          <span
            key={item.id}
            className="flex items-center justify-between border-b border-stroke-300 pb-4 w-full"
          >
            <p className="text-base text-stroke-800 md:text-stroke-600">
              {item.title}
            </p>
            <div className="font-bold text-stroke-800">{item.des}</div>
          </span>
        ))}
        <div className="flex flex-col gap-3 w-full">
          <p className="text-base text-stroke-800 md:text-stroke-600">
            متن پیام :
          </p>
          <p className="text-stroke-800 leading-7 whitespace-pre-wrap wrap-break-word bg-stroke-100 rounded-2xl p-4">
            {message.message}
          </p>
        </div>
      </div>
      <ContactStatusControls message={message} />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/contact-messages" prefetch={false} className="btn border px-3 py-2">
      بازگشت به پیام‌ها
    </Link>
  );
}

export default SingleContactMessagePage;
