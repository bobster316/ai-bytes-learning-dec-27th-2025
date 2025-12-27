import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/dashboard"]; // Removed /admin to allow access without auth

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = ["/auth/signin", "/auth/signup"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check authentication status from Supabase
  const isAuthenticated = request.cookies.has("sb-access-token");

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to sign in if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    // TODO: Add a check to see if the user has the 'admin' role
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
