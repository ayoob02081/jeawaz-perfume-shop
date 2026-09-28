"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { productKeys, useGetAllProducts } from "@/hooks/useProducts";
import { campaignKeys, useGetActiveCampaign } from "@/hooks/useCampaigns";
import {
  offProductsSectionView,
  resolveOffProductsSource,
} from "@/utils/homeCampaignSection.mjs";
import { HOME_SECTION_SKELETON_COUNT } from "@/utils/homeProductSection.mjs";
import HomePageSortProductsLayout from "./HomePageSortProductsLayout";
import ProductCard from "./ProductCard";
import { ProductCardSkeletons } from "./skeleton/ProductCardSkeletons";
import CampaignCountdown from "@/components/CampaignCountdown";
import Error from "@/components/Error";

const fallbackQuery = {
  sort: "most_discounted",
  inStock: true,
  page: 1,
  limit: 8,
};

function CampaignsProducts() {
  const queryClient = useQueryClient();

  // An active campaign supplies both the products and the countdown.
  const activeCampaign = useGetActiveCampaign();
  const campaign = activeCampaign.data;
  const campaignQuery = { ...fallbackQuery, campaignId: campaign?.id };
  const campaignProducts = useGetAllProducts(campaignQuery, {
    enabled: Boolean(campaign?.id),
    placeholderData: undefined,
  });

  const source = resolveOffProductsSource({ activeCampaign, campaignProducts });
  const isCampaign = source === "campaign";

  const { data, isPending, error } = useGetAllProducts(fallbackQuery, {
    enabled: source === "fallback",
  });

  const campaignId = campaign?.id;
  const handleCampaignExpire = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: campaignKeys.active() });
    queryClient.invalidateQueries({
      queryKey: productKeys.list({ ...fallbackQuery, campaignId }),
    });
    queryClient.invalidateQueries({
      queryKey: productKeys.list(fallbackQuery),
    });
  }, [queryClient, campaignId]);

  const section = isCampaign ? campaignProducts : { data, isPending, error };

  const getFullHrefParams = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "12");
    params.set("sort", "most_discounted");
    return params;
  };

  const products = section.data?.data || [];
  const view = offProductsSectionView({ source, section });

  if (view === "error") {
    return <Error />;
  }
  return (
    <HomePageSortProductsLayout
      params={getFullHrefParams()}
      title={"پرتخفیف ترین"}
      des={"محصولات"}
      desc={"پرتخفیف ترین رایحه ها ، همین‌جاست."}
      className="overflow-x-auto"
      bgColor="bg-stroke-50 dark:bg-stroke-50/50 rounded-2xl py-6"
      timer={
        isCampaign && (
          <CampaignCountdown
            endsAt={campaign.endsAt}
            onExpire={handleCampaignExpire}
            clockOffsetMs={campaign.clockOffsetMs}
          />
        )
      }
    >
      {view === "loading" ? (
        <ProductCardSkeletons count={HOME_SECTION_SKELETON_COUNT} />
      ) : (
        products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isPending={section.isPending}
            error={section.error}
          />
        ))
      )}
    </HomePageSortProductsLayout>
  );
}

export default CampaignsProducts;
