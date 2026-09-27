"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Error from "@/components/Error";
import Loading from "@/components/Loading";
import NotExisted from "@/components/NotExisted";
import PagesNumber from "@/components/PagesNumber";
import { useGetAdminContactMessages } from "@/hooks/useAdminContactMessages";
import {
  ADMIN_CONTACT_PAGE_LIMIT,
  contactMessageStatusConfig,
  getAdminContactTotalPages,
  parseAdminContactQuery,
} from "@/utils/adminContactMessagesContract.mjs";
import ContactStatusButton from "./ContactStatusButton";
import ContactMessagesListTable from "./ContactMessagesListTable";

function ContactMessagesLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const { page, status } = useMemo(
    () => parseAdminContactQuery(searchParams),
    [searchParams],
  );

  const updateParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(search);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null) params.delete(key);
        else params.set(key, String(value));
      });

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, search],
  );

  // Paging keeps the active status filter (it stays in the URL).
  const setPage = useCallback(
    (newPage) => {
      updateParams({ page: newPage });
    },
    [updateParams],
  );

  const setStatus = useCallback(
    (newStatus) => {
      updateParams({
        status: newStatus || undefined,
        page: 1,
      });
    },
    [updateParams],
  );

  const {
    data: messages,
    isLoading,
    error,
  } = useGetAdminContactMessages({
    page,
    limit: ADMIN_CONTACT_PAGE_LIMIT,
    status,
  });

  const totalPages = isLoading ? 0 : getAdminContactTotalPages(messages);
  const rows = messages?.data ?? [];

  return (
    <div className="flex flex-col justify-between gap-4 lg:gap-6 max-lg:w-full lg:w-[calc(100%-88px)] 2xl:w-[calc(100%-270px)] lg:px-4 2xl:px-0 pt-0 pb-10">
      <h1 className="font-bold text-xl text-stroke-800 px-4">
        پیام‌های تماس با ما
      </h1>
      <div className="flex flex-col gap-2 w-full overflow-hidden">
        <div className="flex items-center justify-start max-md:gap-4 gap-8 overflow-x-auto scrollbar-none px-4 py-1 w-full text-nowrap">
          {contactMessageStatusConfig.map((item) => (
            <ContactStatusButton
              key={item.id}
              statusBtnData={item}
              messages={messages}
              isLoading={isLoading}
              setStatus={setStatus}
              currentStatus={status}
            />
          ))}
        </div>
      </div>
      {error ? (
        <Error />
      ) : isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <NotExisted className="h-60">پیامی وجود ندارد!</NotExisted>
      ) : (
        <div className="size-full max-lg:px-4">
          <ContactMessagesListTable
            messages={rows}
            page={page}
            limit={ADMIN_CONTACT_PAGE_LIMIT}
          />
        </div>
      )}
      <PagesNumber
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        isLoading={isLoading}
      />
    </div>
  );
}

export default ContactMessagesLayout;
