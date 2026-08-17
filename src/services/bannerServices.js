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

// -------------------------
// دریافت همه بنرها
// GET /banners
// GET /banners?type=primary
// GET /banners?type=secondary
// -------------------------

export const getAllBannersApi = (params = {}) =>
  app
    .get("/banners", {
      params: cleanParams(params),
    })
    .then(({ data }) => data);

// -------------------------
// دریافت بنرهای فعال
// GET /banners/active
// GET /banners/active?type=primary
// GET /banners/active?type=secondary
// -------------------------

export const getActiveBannersApi = (params = {}) =>
  app
    .get("/banners/active", {
      params: cleanParams(params),
    })
    .then(({ data }) => data);

// -------------------------
// دریافت یک بنر
// GET /banners/:id
// -------------------------

export const getBannerByIdApi = (id) =>
  app
    .get(`/banners/${encodeURIComponent(id)}`)
    .then(({ data }) => data);

// -------------------------
// ساخت بنر
// POST /banners
// Admin
// -------------------------

export const addBannerApi = (payload) =>
  app.post("/banners", payload).then(({ data }) => data);

// -------------------------
// ویرایش بنر
// PATCH /banners/:id
// Admin
// -------------------------

export const updateBannerApi = ({ bannerId, data: payload }) =>
  app
    .patch(`/banners/${encodeURIComponent(bannerId)}`, payload)
    .then(({ data }) => data);

// -------------------------
// تغییر وضعیت فعال/غیرفعال
// PATCH /banners/:id/toggle
// Admin
// -------------------------

export const toggleBannerApi = (id) =>
  app
    .patch(`/banners/${encodeURIComponent(id)}/toggle`)
    .then(({ data }) => data);

// -------------------------
// حذف بنر
// DELETE /banners/:id
// Admin
// -------------------------

export const removeBannerApi = (id) =>
  app
    .delete(`/banners/${encodeURIComponent(id)}`)
    .then(({ data }) => data);