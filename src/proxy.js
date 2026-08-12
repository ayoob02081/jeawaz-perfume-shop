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
    return;
  }

  const user = await middlewareAuth(req);

  // -------------------------
  // Profile protection
  // -------------------------

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    if (user?.statusCode === 401) {
      return Response.redirect(new URL("/auth/login", url));
    }

    return;
  }

  // -------------------------
  // Admin protection
  // -------------------------

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Not authenticated
    if (user?.statusCode === 401) {
      return Response.redirect(new URL("/auth/login", url));
    }

    // Authenticated but not admin
    if (user?.role !== "admin") {
      return Response.redirect(new URL("/", url));
    }

    return;
  }
}

export const config = {
  matcher: [
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
  ],
};