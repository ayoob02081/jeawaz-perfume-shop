"use client";

import axios from "axios";

const app = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  paramsSerializer: {
    indexes: null,
  },
});

let refreshPromise = null;

app.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;
    const url = originalConfig?.url || "";

    if (
      err.response?.status === 401 &&
      !originalConfig._retry &&
      !url.includes("/auth/refresh")
    ) {
      originalConfig._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = app.post("/auth/refresh").finally(() => {
            refreshPromise = null;
          });
        }

        await refreshPromise;
        return app(originalConfig);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  },
);

export default app;
