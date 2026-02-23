import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signIn",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || "";
        token.type = user.type;
        token.enabled = user.enabled;
        token.pending = user.pending;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.type = token.type;
      session.user.enabled = token.enabled;
      session.user.pending = token.pending;

      return session;
    },
  },
} satisfies NextAuthConfig;
