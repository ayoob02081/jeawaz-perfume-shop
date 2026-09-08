"use client";

import { useGetAllBanners } from "@/hooks/useBanners";
import BannersListTable from "./BannersListTable";
import Loading from "@/components/Loading";
import Link from "next/link";
import NotExisted from "@/components/NotExisted";
import { useState } from "react";
import RadioButton from "@/ui/RadioButton";

function BannerLayout() {
  const [type, setType] = useState("primary");
  const { data, isPending } = useGetAllBanners({ type });
  // const banners = data?.data || [];
  // const meta = data?.meta;

  return (
    <div className="flex flex-col justify-center gap-4 space-y-2 w-full px-4 pb-10 overflow-hidden">
      <div className="flex items-center gap-4 justify-between w-full">
        <h1 className="font-bold text-stroke-800 text-xl">بنرها</h1>
        <Link
          href={"/admin/banners/add"}
          className="btn btn--primary border py-1.5 px-3"
        >
          اضافه کردن بنر
        </Link>
      </div>
      <div className="flex items-center justify-stretch gap-4">
        <RadioButton
          className="w-full"
          name="bannersType"
          checked={type === "primary"}
          onChange={() => setType("primary")}
          value="primary"
        >
          <p
            className={`flex items-center justify-center py-2 px-3 border-[1.5px] rounded-full w-full ${type === "primary" ? "font-bold text-primary border-primary" : "text-stroke-500 border-stroke-500"} transition-all duration-200`}
          >
            اصلی
          </p>
        </RadioButton>
        <RadioButton
          className="w-full"
          name="bannersType"
          checked={type === "secondary"}
          onChange={() => setType("secondary")}
          value="secondary"
        >
          <p
            className={`flex items-center justify-center py-2 px-3 border-[1.5px] rounded-full w-full ${type === "secondary" ? "font-bold text-primary border-primary" : "text-stroke-500 border-stroke-500"} transition-all duration-200`}
          >
            ثانویه
          </p>
        </RadioButton>
      </div>
      {isPending ? (
        <Loading />
      ) : (
        <BannersListTable banners={data} setType={setType} />
      )}
      {data && !isPending && data?.length === 0 && (
        <NotExisted className="h-96">بنری تعریف نشده است!</NotExisted>
      )}
    </div>
  );
}

export default BannerLayout;
