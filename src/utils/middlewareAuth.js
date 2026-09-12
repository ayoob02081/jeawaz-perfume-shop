function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const setCookie = headers.get("set-cookie");

  return setCookie ? [setCookie] : [];
}

function cookiesFromSetCookieHeaders(setCookies) {
  return setCookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

export default async function middlewareAuth(req) {
  const originalCookie = req.headers.get("cookie") || "";

  try {
    // ---------------------------------
    // 1. First try: current access token
    // ---------------------------------

    let userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      {
        method: "GET",
        headers: {
          Cookie: originalCookie,
        },
        cache: "no-store",
      },
    );

    // ---------------------------------
    // Access token expired
    // Try refresh
    // ---------------------------------

    if (userResponse.status === 401) {
      const refreshResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: {
            Cookie: originalCookie,
          },
          cache: "no-store",
        },
      );

      // Refresh failed
      if (!refreshResponse.ok) {
        return {
          user: null,
          statusCode: refreshResponse.status,
          setCookies: [],
        };
      }

      // ---------------------------------
      // Get new cookies from backend
      // ---------------------------------

      const setCookies = getSetCookies(refreshResponse.headers);

      // ---------------------------------
      // Build cookies containing new tokens
      // for the retry request
      // ---------------------------------

      const refreshedCookies = cookiesFromSetCookieHeaders(setCookies);

      const retryCookie = [originalCookie, refreshedCookies]
        .filter(Boolean)
        .join("; ");
      // ---------------------------------
      // Retry /users/me with new token
      // ---------------------------------

      userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        {
          method: "GET",
          headers: {
            Cookie: retryCookie,
          },
          cache: "no-store",
        },
      );

      // User still unauthorized
      if (!userResponse.ok) {
        return {
          user: null,
          statusCode: userResponse.status,
          setCookies,
        };
      }

      const user = await userResponse.json();

      return {
        user,
        statusCode: 200,
        setCookies,
      };
    }

    // ---------------------------------
    // Access token is valid
    // ---------------------------------

    if (!userResponse.ok) {
      return {
        user: null,
        statusCode: userResponse.status,
        setCookies: [],
      };
    }

    const user = await userResponse.json();

    return {
      user,
      statusCode: 200,
      setCookies: [],
    };
  } catch (error) {
    console.error("middlewareAuth error:", error);

    return {
      user: null,
      statusCode: 500,
      setCookies: [],
    };
  }
}
