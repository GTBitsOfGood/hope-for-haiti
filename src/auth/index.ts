import NextAuth, { CredentialsSignin, DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// eslint-disable-next-line
import { JWT } from "next-auth/jwt";

import { INVALID_CREDENTIALS_ERR } from "./errors";
import { UserType } from "@prisma/client";
import { db } from "@/db";
import { verify } from "argon2";

class InvalidCredentialsError extends CredentialsSignin {
  code = INVALID_CREDENTIALS_ERR;
}

declare module "next-auth" {
  interface User {
    type: UserType;
  }

  interface Session {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    type: UserType;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.SECRET,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });
        if (!user) throw new InvalidCredentialsError();

        const passwordsMatch = await verify(
          user.passwordHash,
          credentials.password as string
        );
        if (!passwordsMatch) throw new InvalidCredentialsError();

        return {
          id: user.id.toString(),
          type: user.type,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || "";
        token.type = user.type;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.type = token.type;

      return session;
    },
  },
  pages: {
    signIn: "/sign_in",
  },
});
