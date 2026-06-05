import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config: callbacks, pages, and session strategy only — no
 * Credentials provider (which imports Prisma/bcrypt and cannot run on the Edge).
 * The full config (lib/auth/index.ts) spreads this and adds the provider; the
 * middleware instance (lib/auth/edge.ts) uses this alone to read/verify the JWT
 * (including the role) without touching the database.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // On sign-in, persist the role from the authorized user onto the token.
      if (user) token.role = (user as { role?: string }).role ?? "USER";
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (typeof token.role === "string") session.user.role = token.role;
      return session;
    },
  },
};
