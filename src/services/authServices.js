import http from "./httpService";

// export function getOTPApi(data) {
//   return http.post("/user/get-otp", data).then(({ data }) => data.data);
// }

// export function checkOTPApi(data) {
//   return http.post("/user/check-otp", data).then(({ data }) => data.data);
// }

export function loginApi(data) {
  return http.post("/auth/login", data).then(({data}) => data);
}

// export function completeProfileApi(data) {
//   return http
//     .post("/user/complete-profile", data)
//     .then(({ data }) => data.data);
// }

// export function getUserApi() {
//   return http.get("/user/profile").then(({ data }) => data.data);
// }

export function getAllUsersApi() {
  return http.get("/users").then((data) => data);
}

// export function updateProfileApi(data) {
//   return http.patch("/user/update", data).then(({ data }) => data.data);
// }

// export function logoutApi() {
//   return http.post("/user/logout");
// }
