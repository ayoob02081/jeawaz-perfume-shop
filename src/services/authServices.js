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

// Phone-number change, in two steps; each request sends one SMS to one
// number. The two code checks answer 401 for a wrong code, so they opt out of
// the client's refresh-and-resend (resending would count a second failed
// attempt); the authenticated read before each one refreshes an expired
// access token through the normal path. A 403 from a new-number call means
// the current-number proof is gone and the flow starts over.

// Step 1: one code to the account's current number (the server knows it; no
// body). Answers { message, challengeId, expiresAt }.
export function requestCurrentPhoneCodeApi() {
  return app
    .post("/auth/phone-change/current/request", {})
    .then(({ data }) => data);
}

// Step 1 check. Answers { message, proofId, proofExpiresAt }.
export async function verifyCurrentPhoneCodeApi({ challengeId, code }) {
  await app.get("/users/me");
  const { data } = await app.post(
    "/auth/phone-change/current/verify",
    { challengeId, code },
    { skipAuthRefresh: true },
  );
  return data;
}

// Step 2: one code to the new number, only with a valid proof. Answers
// { message, challengeId, expiresAt }.
export function requestNewPhoneCodeApi({ proofId, phoneNumber }) {
  return app
    .post("/auth/phone-change/new/request", { proofId, phoneNumber })
    .then(({ data }) => data);
}

// Step 2 check: the change itself. On success the backend sets fresh session
// cookies; the body holds no tokens.
export async function verifyNewPhoneCodeApi({ challengeId, code }) {
  await app.get("/users/me");
  const { data } = await app.post(
    "/auth/phone-change/new/verify",
    { challengeId, code },
    { skipAuthRefresh: true },
  );
  return data;
}
