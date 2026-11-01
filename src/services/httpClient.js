"use client";

import axios from "axios";
import {
  isDefinitiveRefreshFailure,
  notifySessionExpired,
} from "../utils/authSessionEvents.mjs";

import { sessionLifecycle, SessionSupersededError } from "../utils/sessionLifecycle.mjs";

const app = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  paramsSerializer: {
    indexes: null,
  },
});

let refreshPromise = null;
const sessionScoped = (config) => /^\/(cart|users|addresses|orders|notifications|auth)(\/|\?|$)/.test(config?.url || "");
// Only this verified public GET is independent of browser identity.
const publicBannerRead = (config) => config?.method === "get" && config.url === "/banners/active";
app.interceptors.request.use((config) => {
  if (!publicBannerRead(config)) sessionLifecycle.assertCurrent(config._sessionGeneration);
  if (/^\/cart(\/|\?|$)/.test(config.url || "")) {
    const controller = new AbortController();
    const callerSignal = config._sessionCallerSignal ?? config.signal;
    config._sessionCallerSignal = callerSignal;
    const abort = () => controller.abort();
    if (callerSignal?.aborted) abort();
    else callerSignal?.addEventListener("abort", abort, { once: true });
    const unsubscribe = sessionLifecycle.subscribe(() => {
      if (!sessionLifecycle.current(config._sessionGeneration)) abort();
    });
    config.signal = controller.signal;
    config._sessionAbortCleanup = () => {
      unsubscribe();
      callerSignal?.removeEventListener("abort", abort);
    };
  }
  return config;
}, undefined, {
  // Axios evaluates runWhen synchronously while constructing the request chain,
  // even when its interceptors are asynchronous. Preserve it on every retry.
  runWhen(config) {
    config._sessionGeneration ??= sessionLifecycle.generation();
    return true;
  },
});

app.interceptors.response.use(
  (res) => {
    res.config?._sessionAbortCleanup?.();
    if (sessionScoped(res.config)) sessionLifecycle.assertCurrent(res.config._sessionGeneration);
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    originalConfig?._sessionAbortCleanup?.();
    const url = originalConfig?.url || "";
    if (originalConfig && !publicBannerRead(originalConfig) && !sessionLifecycle.current(originalConfig._sessionGeneration) &&
        (sessionScoped(originalConfig) || err.response?.status === 401)) {
      throw new SessionSupersededError();
    }

    // `skipAuthRefresh`: a request whose 401 is a domain answer (e.g. a wrong
    // phone-change code) is never refreshed-and-resent, which would submit it
    // a second time.
    if (
      err.response?.status === 401 &&
      !publicBannerRead(originalConfig) &&
      !originalConfig._retry &&
      !originalConfig.skipAuthRefresh &&
      !url.includes("/auth/refresh")
    ) {
      // Identity reconciliation may be in flight on focus. Its /users/me
      // request must be allowed to refresh; other old operations must first
      // learn whether these are still the same account's cookies.
      if (!/^\/(users\/me|auth)(\/|$|\?)/.test(url)) {
        await sessionLifecycle.waitUntilReady(originalConfig._sessionGeneration);
      }
      sessionLifecycle.assertCurrent(originalConfig._sessionGeneration);
      originalConfig._retry = true;

      try {
        if (!refreshPromise || refreshPromise.generation !== originalConfig._sessionGeneration) {
          // One signal per failed refresh, however many requests wait on it:
          // a rejected refresh means the session is over (the backend has
          // cleared its cookies), so the app must become logged out.
          const captured = originalConfig._sessionGeneration;
          const entry = { generation: captured };
          entry.promise = app
            .post("/auth/refresh", undefined, { _sessionGeneration: captured })
            .catch((refreshError) => {
              if (sessionLifecycle.current(captured) && isDefinitiveRefreshFailure(refreshError)) {
                notifySessionExpired();
              }
              throw refreshError;
            })
            .finally(() => {
              if (refreshPromise === entry) refreshPromise = null;
            });
          refreshPromise = entry;
        }

        await refreshPromise.promise;
        sessionLifecycle.assertCurrent(originalConfig._sessionGeneration);
        return app(originalConfig);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  },
);

export default app;
