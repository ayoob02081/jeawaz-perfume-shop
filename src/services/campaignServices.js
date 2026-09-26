import app from "./httpClient";
import { withClockOffset } from "@/utils/homeCampaignSection.mjs";

export const getAllCampaignsApi = () =>
  app.get("/campaigns").then(({ data }) => data);

export const getActiveCampaignApi = () =>
  app
    .get("/campaigns/active")
    .then(({ data }) => withClockOffset(data ?? null, Date.now()));

export const getCampaignByIdApi = (id) =>
  app.get(`/campaigns/${encodeURIComponent(id)}`).then(({ data }) => data);

export const addCampaignApi = (payload) =>
  app.post("/campaigns", payload).then(({ data }) => data);

export const updateCampaignApi = ({ campaignId, data: payload }) =>
  app
    .patch(`/campaigns/${encodeURIComponent(campaignId)}`, payload)
    .then(({ data }) => data);
