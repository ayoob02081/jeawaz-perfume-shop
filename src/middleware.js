import { NextResponse } from "next/server";
import middlewareAuth from "./utils/middlewareAuth";

export async function middleware(req) {
  const url = req.url;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/profile")) {
    const user = await middlewareAuth(req);
    if (user.statusCode === 401)
      return NextResponse.redirect(new URL("/auth/login", url));
  }

  if (pathname.startsWith("/admin")) {
    const user = await middlewareAuth(req);
    if (user.statusCode === 401)
      return NextResponse.redirect(new URL("/auth/login", url));
    if (user && user.role !== "admin")
      return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
