/**
 * Next.js 16: middleware.ts is deprecated — use proxy.ts with a named "proxy" export.
 *
 * We only apply auth checks to routes that actually need them.
 * Short-link slugs (e.g. /QLru7o) are excluded from this matcher
 * so they incur zero session/JWT overhead and redirect instantly.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/admin-login",
    "/sign-in",
    "/sign-up",
    "/api/:path*",
  ],
};
