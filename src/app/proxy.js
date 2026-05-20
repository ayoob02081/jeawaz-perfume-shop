import middlewareAuth from "@/utils/middlewareAuth";

let cachedUser = null;
let lastFetchTime = 0;
const CACHE_TTL = 3000; // 3 seconds cache

export default async function proxy(req) {
  const pathname = req.nextUrl.pathname;
  const url = req.url;

  // Fetch user only once every 3 seconds
  const now = Date.now();
  let user = cachedUser;

  const needsUser =
    pathname.startsWith("/profile") || pathname.startsWith("/admin");

  if (needsUser) {
    if (!cachedUser || now - lastFetchTime > CACHE_TTL) {
      user = await middlewareAuth(req);
      cachedUser = user;
      lastFetchTime = now;
    }
  }

  // Protect /profile
  if (pathname.startsWith("/profile")) {
    if (user?.statusCode === 401) {
      return Response.redirect(new URL("/auth/login", url));
    }
  }

  // Protect /admin
  if (pathname.startsWith("/admin")) {
    if (user?.statusCode === 401) {
      return Response.redirect(new URL("/auth/login", url));
    }

    if (user?.role !== "admin") {
      return Response.redirect(new URL("/", url));
    }
  }
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*"],
};
