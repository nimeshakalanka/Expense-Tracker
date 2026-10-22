import type { NextAuthConfig } from "next-auth";

const PUBLIC_ROUTES = ["/login", "/register"];

const secureCookiePrefix =
  process.env.VERCEL === "1" || process.env.AUTH_URL?.startsWith("https://") ? "__Secure-" : "";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  cookies: { sessionToken: { name: `${secureCookiePrefix}ledgerly.session-token` } },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const signedIn = !!auth?.user;
      const isPublic = PUBLIC_ROUTES.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) {
        return signedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }
      return signedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
