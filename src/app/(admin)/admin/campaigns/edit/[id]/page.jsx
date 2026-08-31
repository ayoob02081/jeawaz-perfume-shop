"use client";

import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import CampaignForm from "../../_components/CampaignForm";
import { useGetCampaignById } from "@/hooks/useCampaigns";

function page() {
  const { id } = useParams();
  const { data, isPending } = useGetCampaignById(id);
  const campaign = data || {};

  if (isPending) return <Loading />;

  return <CampaignForm campaignToEdit={campaign} />;
}

export default page;
