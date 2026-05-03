import http from "./httpClient";

export function getUserApi() {
  return http.get("/users/me").then(({ data }) => data);
}

export async function getAllUsersApi() {
  const { data } = await http.get("/users");

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return []; // ✅ در هر حالت، حداقل یه آرایه خالی
}
