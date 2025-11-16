import NextAuth, { CredentialsSignin, DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// eslint-disable-next-line
import { JWT } from "next-auth/jwt";

import { INVALID_CREDENTIALS_ERR } from "./errors";
import { UserType } from "@prisma/client";
import { db } from "@/db";
import { verify } from "argon2";
import authConfig from "@/auth/auth.config";
import {
  PERMISSION_FIELDS,
  PermissionFlags,
  PERMISSION_SELECT,
} from "@/types/api/user.types";

class InvalidCredentialsError extends CredentialsSignin {
  code = INVALID_CREDENTIALS_ERR;
}

declare module "next-auth" {
  interface User extends PermissionFlags {
    type: UserType;
    streamUserId: string | null;
    streamUserToken: string | null;
    enabled: boolean;
    tag?: string;
    dashboardTutorial: boolean;
    itemsTutorial: boolean;
    requestsTutorial: boolean;
    wishlistsTutorial: boolean;
  }

  interface Session {
    user: {
      id: string;
      type: UserType;
      name: string | null | undefined;
      streamUserId: string | null;
      streamUserToken: string | null;
      tag?: string;
      enabled: boolean;
      dashboardTutorial: boolean;
      itemsTutorial: boolean;
      requestsTutorial: boolean;
      wishlistsTutorial: boolean;
    } & DefaultSession["user"] &
      PermissionFlags;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends PermissionFlags {
    id: string;
    type: UserType;
    enabled: boolean;
    name: string | null | undefined;
    streamUserId: string | null;
    streamUserToken: string | null;
    tag?: string;
    dashboardTutorial: boolean;
    itemsTutorial: boolean;
    requestsTutorial: boolean;
    wishlistsTutorial: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
            name: true,
            passwordHash: true,
            type: true,
            enabled: true,
            tag: true,
            streamUserId: true,
            streamUserToken: true,
            ...PERMISSION_SELECT,
            dashboardTutorial: true,
            itemsTutorial: true,
            requestsTutorial: true,
            wishlistsTutorial: true,
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
          name: user.name,
          streamUserId: user.streamUserId,
          streamUserToken: user.streamUserToken,
          tag: user.tag ?? undefined,
          dashboardTutorial: user.dashboardTutorial,
          itemsTutorial: user.itemsTutorial,
          requestsTutorial: user.requestsTutorial,
          wishlistsTutorial: user.wishlistsTutorial,
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
        token.name = user.name ?? user.email ?? `User ${user.id}`;
        token.streamUserId = user.streamUserId;
        token.streamUserToken = user.streamUserToken;
        token.tag = user.tag;
        PERMISSION_FIELDS.forEach((field) => {
          token[field] = user[field];
        });
        token.dashboardTutorial = user.dashboardTutorial;
        token.itemsTutorial = user.itemsTutorial;
        token.requestsTutorial = user.requestsTutorial;
        token.wishlistsTutorial = user.wishlistsTutorial;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.type = token.type;
      session.user.enabled = token.enabled;
      session.user.name = token.name;
      session.user.streamUserId = token.streamUserId;
      session.user.streamUserToken = token.streamUserToken;
      session.user.tag = token.tag;
      PERMISSION_FIELDS.forEach((field) => {
        session.user[field] = Boolean(token[field]);
      });
      session.user.dashboardTutorial = Boolean(token.dashboardTutorial);
      session.user.itemsTutorial = Boolean(token.itemsTutorial);
      session.user.requestsTutorial = Boolean(token.requestsTutorial);
      session.user.wishlistsTutorial = Boolean(token.wishlistsTutorial);

      return session;
    },
  },
  pages: {
    signIn: "/signIn",
  },
});
