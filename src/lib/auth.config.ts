import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/admin");
      const isOnAuth = nextUrl.pathname.startsWith("/sign-in") || nextUrl.pathname.startsWith("/sign-up");

      if (isOnDashboard) return isLoggedIn;
      if (isOnAuth && isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
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
