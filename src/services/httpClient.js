"use client";

import axios from "axios";

const app = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

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
        await app.post("/auth/refresh");
        return app(originalConfig);
      } catch {
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  },
);

export default app;
