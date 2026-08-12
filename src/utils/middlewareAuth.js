import { toStringCookies } from "./toStringCookies";

export default async function middlewareAuth(req) {
  const strCookie = toStringCookies(req.cookies);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      {
        method: "GET",
        headers: {
          Cookie: strCookie,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return {
        statusCode: res.status,
      };
    }

    return await res.json();
  } catch (error) {
    console.error("middlewareAuth error:", error);

    return {
      statusCode: 500,
    };
  }
}