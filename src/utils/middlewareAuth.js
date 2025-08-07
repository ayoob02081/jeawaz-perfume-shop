import { toStringCookies } from "./toStringCookies";

export default async function middlewareAuth(req) {
  const strCookie = toStringCookies(req.cookies);

  const { data } = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/user/profile`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Cookie: strCookie,
      },
    }
  ).then((res) => res.json());
  const { user } = data || {};
  return user;
}
