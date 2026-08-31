import app from "./httpClient";

const cleanParams = (params = {}) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return;
    }

    cleaned[key] = value;
  });

  return cleaned;
};

export const getAllCampaignsApi = (params = {}) =>
  app
    .get("/campaigns", {
      params: cleanParams(params),
    })
    .then(({ data }) => data);

export const getCampaignByIdApi = (id) =>
  app.get(`/campaigns/${encodeURIComponent(id)}`).then(({ data }) => data);

export const addCampaignApi = (payload) =>
  app.post("/campaigns", payload).then(({ data }) => data);

export const updateCampaignApi = ({ campaignId, data: payload }) =>
  app
    .patch(`/campaigns/${encodeURIComponent(campaignId)}`, payload)
    .then(({ data }) => data);
