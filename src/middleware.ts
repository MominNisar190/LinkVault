import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  /*
   * Only run NextAuth middleware on routes that actually need auth or session:
   * - /dashboard and sub-routes
   * - /admin and sub-routes (but NOT /admin-login — handled inside authConfig)
   * - /sign-in, /sign-up, /admin-login (auth pages)
   * - /api routes
   *
   * Short-link slugs (e.g. /QLru7o) are intentionally excluded so they skip
   * the JWT/session overhead and redirect as fast as possible.
   */
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/admin-login",
    "/sign-in",
    "/sign-up",
    "/api/:path*",
  ],
};
