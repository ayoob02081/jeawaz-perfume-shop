"use client";

import { useGetBannerById } from "@/hooks/useBanners";
import { useParams } from "next/navigation";
import BannerForm from "../../_components/BannerForm,";
import Loading from "@/components/Loading";

function page() {
  const { id } = useParams();
  const { data, isPending } = useGetBannerById(id);
  const banner = data || {};

  if (isPending) return <Loading />;

  return <BannerForm bannerToEdit={banner} />;
}

export default page;
