import NextAuth, { CredentialsSignin, DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// eslint-disable-next-line
import { JWT } from "next-auth/jwt";

import { INVALID_CREDENTIALS_ERR } from "./errors";
import { UserType } from "@prisma/client";
import { db } from "@/db";
import { verify } from "argon2";
import { PERMISSION_FIELDS, PermissionFlags, PERMISSION_SELECT } from "@/types/api/user.types";

class InvalidCredentialsError extends CredentialsSignin {
  code = INVALID_CREDENTIALS_ERR;
}

declare module "next-auth" {
  interface User extends PermissionFlags {
    type: UserType;
    enabled: boolean;
    tag?: string;
  }

  interface Session {
    user: {
      id: string;
      type: UserType;
      tag?: string;
      enabled: boolean;
    } & DefaultSession["user"] &
      PermissionFlags;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends PermissionFlags {
    id: string;
    type: UserType;
    enabled: boolean;
    tag?: string;
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
          select: {
            id: true,
            passwordHash: true,
            type: true,
            enabled: true,
            tag: true,
            ...PERMISSION_SELECT,
          },
        });
        if (!user) throw new InvalidCredentialsError();

        const passwordsMatch = await verify(
          user.passwordHash,
          credentials.password as string
        );
        if (!passwordsMatch) throw new InvalidCredentialsError();

        return {
          ...user,
          id: user.id.toString(),
          type: user.type,
          enabled: user.enabled,
          tag: user.tag ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || "";
        token.type = user.type;
        token.enabled = user.enabled;
        token.tag = user.tag;
        PERMISSION_FIELDS.forEach((field) => {
          token[field] = user[field];
        });
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.type = token.type;
      session.user.enabled = token.enabled;
      session.user.tag = token.tag;
      PERMISSION_FIELDS.forEach((field) => {
        session.user[field] = Boolean(token[field]);
      });

      return session;
    },
  },
  pages: {
    signIn: "/signIn",
  },
});
