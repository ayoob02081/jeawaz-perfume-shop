import app from "./httpClient";

export function loginApi(data) {
  return app.post("/auth/login", data).then(({ data }) => data);
}

export function logoutApi() {
  return app.post("/auth/logout").then(({ data }) => data);
}

export function requestOtpApi(data) {
  return app.post("/auth/request-otp", data).then(({ data }) => data);
}

export function verifyOtpApi(data) {
  return app.post("/auth/verify-otp", data).then(({ data }) => data);
}

export function refreshApi() {
  return app.post("/auth/refresh").then(({ data }) => data);
}
