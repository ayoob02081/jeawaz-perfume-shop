import app from "./httpClient";

// Credential checks: their own 401 (wrong password, wrong or expired code) is
// the answer, not an expired session, so they opt out of the client's
// refresh-and-resend; resending would submit the credential a second time.
export function loginApi(data) {
  return app
    .post("/auth/login", data, { skipAuthRefresh: true })
    .then(({ data }) => data);
}

export function logoutApi() {
  return app.post("/auth/logout").then(({ data }) => data);
}

export function requestOtpApi(data) {
  return app.post("/auth/request-otp", data).then(({ data }) => data);
}

export function verifyOtpApi(data) {
  return app
    .post("/auth/verify-otp", data, { skipAuthRefresh: true })
    .then(({ data }) => data);
}

export function refreshApi() {
  return app.post("/auth/refresh").then(({ data }) => data);
}

// Phone-number change, step 1: one code to the current and one to the new
// number. Answers { message, challengeId, expiresAt }.
export function requestPhoneChangeApi(phoneNumber) {
  return app
    .post("/auth/phone-change/request", { phoneNumber })
    .then(({ data }) => data);
}

// Phone-number change, step 2. A wrong code answers 401, so this request
// opts out of the client's refresh-and-resend (resending would count a second
// failed attempt). The authenticated read before it refreshes an expired
// access token through the normal path. On success the backend sets fresh
// session cookies; the body holds no tokens.
export async function verifyPhoneChangeApi({
  challengeId,
  currentPhoneCode,
  newPhoneCode,
}) {
  await app.get("/users/me");
  const { data } = await app.post(
    "/auth/phone-change/verify",
    { challengeId, currentPhoneCode, newPhoneCode },
    { skipAuthRefresh: true },
  );
  return data;
}
