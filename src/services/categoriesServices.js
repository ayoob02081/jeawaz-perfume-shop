import app from "./httpClient";

export function getAllCategoriesApi() {
  return app.get(`/categories`).then(({ data }) => data);
}

export function getCategoryByIdApi(id) {
  return app.get(`/categories/${id}`).then(({ data }) => data);
}

export const getCategoriesByTypeApi = (type) =>
  app.get(`/categories/type/${type}`).then(({ data }) => data);

export function getAllBrandsApi() {
  return app.get(`/brands`).then(({ data }) => data);
}

export function getBrandByIdApi(id) {
  return app.get(`/brands/${id}`).then(({ data }) => data);
}

export function addCategoryApi(data) {
  return app.post("/categories", data).then(({ data }) => data);
}

export function updateCategoryApi({ categoryId, data }) {
  return app.patch(`/categories/${categoryId}`, data).then(({ data }) => data);
}

export function removeCategoryApi(id) {
  return app.delete(`/categories/${id}`).then(({ data }) => data);
}

export function addBrandApi(data) {
  return app.post("/brands", data).then(({ data }) => data);
}

export function updateBrandApi({ brandId, data }) {
  return app.patch(`/brands/${brandId}`, data).then(({ data }) => data);
}

export function removeBrandApi(id) {
  return app.delete(`/brands/${id}`).then(({ data }) => data);
}
