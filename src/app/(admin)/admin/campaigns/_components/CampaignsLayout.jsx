"use client";

import Link from "next/link";
import NotExisted from "@/components/NotExisted";
import Loading from "@/components/Loading";
import { useGetAllCampaigns } from "@/hooks/useCampaigns";
import CampaignsListTable from "./CampaignsListTable";

function CampaignsLayout() {
  const { data, isPending, error } = useGetAllCampaigns();
  const campaigns = data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-2 w-full px-4 pb-10">
      <div className="flex items-center gap-4 justify-between pb-6 w-full">
        <h1 className="font-bold text-stroke-800 text-xl">کمپین‌ها</h1>
        <Link
          href={"/admin/campaigns/add"}
          className="btn btn--primary border py-1.5 px-3"
        >
          اضافه کردن کمپین
        </Link>
      </div>
      {isPending ? <Loading /> : <CampaignsListTable campaigns={campaigns} />}
      {campaigns && !isPending && campaigns?.length === 0 && (
        <NotExisted className="h-96">کمپینی تعریف نشده است!</NotExisted>
      )}
    </div>
  );
}

export default CampaignsLayout;
