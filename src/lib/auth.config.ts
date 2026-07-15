import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

      const isOnDashboard   = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdminPanel  = nextUrl.pathname.startsWith("/admin") && !nextUrl.pathname.startsWith("/admin-login");
      const isOnAuth        = nextUrl.pathname.startsWith("/sign-in") || nextUrl.pathname.startsWith("/sign-up");
      const isOnAdminLogin  = nextUrl.pathname.startsWith("/admin-login");

      // Protect /dashboard — must be logged in
      if (isOnDashboard) return isLoggedIn;

      // Protect /admin — must be logged in AND be an admin
      if (isOnAdminPanel) {
        if (!isLoggedIn) return Response.redirect(new URL("/admin-login", nextUrl));
        if (!isAdmin)    return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // Redirect already-logged-in admins away from /admin-login
      if (isOnAdminLogin && isLoggedIn && isAdmin) {
        return Response.redirect(new URL("/admin", nextUrl));
      }

      // Redirect already-logged-in users away from auth pages
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id     = user.id;
        token.role   = (user as any).role;
        token.status = (user as any).status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id     = token.id as string;
        (session.user as any).role   = token.role;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
  providers: [],
};
