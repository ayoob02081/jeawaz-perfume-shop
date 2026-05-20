import app from "./httpClient";

export function getUserApi() {
  return app.get("/users/me").then(({ data }) => data);
}

// export function getUsersApi() {
//   return app.get("/users").then(({ data }) => data);
// }

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

export async function getAllUsersApi() {
  const { data } = await app.get("/users");

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}
