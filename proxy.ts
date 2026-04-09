import { createServerClient } from '@supabase/ssr'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/my-courses", "/my-learning", "/account"];

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = ["/auth/signin", "/auth/signup"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response object that we can modify
  let response = NextResponse.next({
    request,
  });

  // Check for environment variables before creating client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Graceful fallback for missing config: skip auth logic
    return response;
  }

  // Create Supabase client with proper cookie handling for SSR
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get the user - this also refreshes the session
  const { data: { user } } = await supabase.auth.getUser();

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to sign in if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && user) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-courses/:path*",
    "/my-learning/:path*",
    "/account/:path*",
    "/auth/:path*",
    "/courses/:path*",
  ],
};
