import http from "./httpService";

export function getUserApi() {
  return http.get("/users/me").then(({ data }) => data);
}

export function getAllUsersApi() {
  return http.get("/users").then((data) => data);
}
