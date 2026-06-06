import app from "./httpClient";

export function getUserApi() {
  return app.get("/users/me").then(({ data }) => data);
}

export function getUserByIdApi(id) {
  return app.get(`/users/${id}`).then(({ data }) => data);
}

export function createUserApi(payload) {
  return app.post("/users", payload).then(({ data }) => data);
}

export function updateUserApi(payload) {
  return app.patch("/users/me", payload).then(({ data }) => data);
}

export function removeUserApi(id) {
  return app.delete(`/users/${id}`).then(({ data }) => data);
}

export function getAllUsersApi() {
  return app.get("/users/admin").then((res) => res.data.data);
}
