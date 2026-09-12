import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { hasPermission, ROUTE_PERMISSIONS, getDefaultRouteForRole } from "@/lib/permissions";
import type { Permission, UserRole } from "@/types";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicRoutes = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/favicon.svg",
  "/icon.svg",
  "/favicon.ico",
  "/logo",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  // Public routes
  if (isPublic) {
    if (pathname === "/login" && req.auth?.user) {
      const role = req.auth.user.role as UserRole;
      return NextResponse.redirect(
        new URL(getDefaultRouteForRole(role), req.url)
      );
    }

    return NextResponse.next();
  }

  // Not authenticated
  if (!req.auth?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);

    if (pathname !== "/login") {
      loginUrl.searchParams.set(
        "callbackUrl",
        pathname
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth.user.role as UserRole;

  // Permission checking
  const matchedRoute = Object.keys(
    ROUTE_PERMISSIONS
  ).find((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (matchedRoute) {
    const permission =
      ROUTE_PERMISSIONS[matchedRoute] as Permission;

    // Uses role-based permissions only
    if (!hasPermission(role, permission)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const defaultRoute = getDefaultRouteForRole(role);
      if (pathname === defaultRoute) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      return NextResponse.redirect(
        new URL(defaultRoute, req.url)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon\\.svg|logo|manifest\\.json|icons|sw\\.js|firebase-messaging-sw\\.js|.*\\.png$|.*\\.svg$).*)",
  ],
};