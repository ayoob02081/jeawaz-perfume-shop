import { NextResponse } from "next/server";

import middlewareAuth from "@/utils/middlewareAuth";

export default async function proxy(req) {
  const pathname = req.nextUrl.pathname;
  const url = req.url;

  const needsUser =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (!needsUser) {
    return NextResponse.next();
  }

  const authResult = await middlewareAuth(req);

  const { user, statusCode, setCookies = [] } = authResult;

  // ---------------------------------
  // Helper
  // ---------------------------------

  const nextResponse = () => {
    const response = NextResponse.next();

    for (const cookie of setCookies) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  };

  const redirectResponse = (path) => {
    const response = NextResponse.redirect(new URL(path, url));

    for (const cookie of setCookies) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  };

  // ---------------------------------
  // Profile
  // ---------------------------------

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    if (statusCode === 401 || !user) {
      return redirectResponse("/auth/login");
    }

    return nextResponse();
  }

  // ---------------------------------
  // Admin
  // ---------------------------------

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Not authenticated
    if (statusCode === 401 || !user) {
      return redirectResponse("/auth/login");
    }

    // Authenticated but not admin
    if (user.role !== "admin") {
      return redirectResponse("/");
    }

    return nextResponse();
  }

  return nextResponse();
}

export const config = {
  matcher: ["/profile", "/profile/:path*", "/admin", "/admin/:path*"],
};
