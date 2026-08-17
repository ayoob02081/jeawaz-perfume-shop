"use client";

import { useGetBannerById } from "@/hooks/useBanners";
import { useParams } from "next/navigation";
import SingleBanner from "../_components/SingleBanner";
import Loading from "@/components/Loading";

function page() {
  const params = useParams();
  const { data, isPending } = useGetBannerById(params?.id);

  if (isPending) {
    return <Loading />;
  }

  return <SingleBanner banner={data || {}} />;
}

export default page;
