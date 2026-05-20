import { toStringCookies } from "./toStringCookies";

export default async function middlewareAuth(req) {
  const strCookie = toStringCookies(req.cookies);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      Cookie: strCookie,
    },
  });

  const data = await res.json();
  return data || {};
}
