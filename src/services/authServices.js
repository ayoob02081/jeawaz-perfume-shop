import http from "./httpService";

export function loginApi(data) {
  return http.post("/auth/login", data).then(({ data }) => data);
}

export function signinApi(data) {
  return http.post("/auth/register", data).then(({ data }) => data);
}

// export function getOTPApi(data) {
//   return http.post("/user/get-otp", data).then(({ data }) => data.data);
// }

// export function checkOTPApi(data) {
//   return http.post("/user/check-otp", data).then(({ data }) => data.data);
// }

// export function completeProfileApi(data) {
//   return http
//     .post("/user/complete-profile", data)
//     .then(({ data }) => data.data);
// }

// export function updateProfileApi(data) {
//   return http.patch("/user/update", data).then(({ data }) => data.data);
// }

// export function logoutApi() {
//   return http.post("/user/logout");
// }
