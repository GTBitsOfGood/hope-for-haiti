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
    pending: boolean;
    tag?: string;
    dashboardTutorial: boolean;
    adminDashboardTutorial: boolean;
    adminSupportTutorial: boolean;
    adminAccountManagementTutorial: boolean;
    adminUnallocatedTutorial: boolean;
    adminDonorOffersTutorial: boolean;
    adminWishlistTutorial: boolean;
    adminDistributionsTutorial: boolean;
    itemsTutorial: boolean;
    requestsTutorial: boolean;
    wishlistsTutorial: boolean;
    siteName?: string;
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
      adminDashboardTutorial: boolean;
      adminSupportTutorial: boolean;
      adminAccountManagementTutorial: boolean;
      adminUnallocatedTutorial: boolean;
      adminDonorOffersTutorial: boolean;
      adminWishlistTutorial: boolean;
      adminDistributionsTutorial: boolean;
      itemsTutorial: boolean;
      requestsTutorial: boolean;
      wishlistsTutorial: boolean;
      pending: boolean;
      siteName?: string;
    } & DefaultSession["user"] &
      PermissionFlags;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends PermissionFlags {
    id: string;
    type: UserType;
    enabled: boolean;
    pending: boolean;
    name: string | null | undefined;
    streamUserId: string | null;
    streamUserToken: string | null;
    tag?: string;
    dashboardTutorial: boolean;
    adminDashboardTutorial: boolean;
    adminSupportTutorial: boolean;
    adminAccountManagementTutorial: boolean;
    adminUnallocatedTutorial: boolean;
    adminDonorOffersTutorial: boolean;
    adminWishlistTutorial: boolean;
    adminDistributionsTutorial: boolean;
    itemsTutorial: boolean;
    requestsTutorial: boolean;
    wishlistsTutorial: boolean;
    siteName?: string;
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
            pending: true,
            tag: true,
            streamUserId: true,
            streamUserToken: true,
            partnerDetails: true, 
            ...PERMISSION_SELECT,
            dashboardTutorial: true,
            adminDashboardTutorial: true,
            adminSupportTutorial: true,
            adminAccountManagementTutorial: true,
            adminUnallocatedTutorial: true,
            adminDonorOffersTutorial: true,
            adminWishlistTutorial: true,
            adminDistributionsTutorial: true,
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
          pending: user.pending,
          name: user.name,
          streamUserId: user.streamUserId,
          streamUserToken: user.streamUserToken,
          tag: user.tag ?? undefined,
          dashboardTutorial: user.dashboardTutorial,
          adminDashboardTutorial: user.adminDashboardTutorial,
          adminSupportTutorial: user.adminSupportTutorial,
          adminAccountManagementTutorial: user.adminAccountManagementTutorial,
          adminUnallocatedTutorial: user.adminUnallocatedTutorial,
          adminDonorOffersTutorial: user.adminDonorOffersTutorial,
          adminWishlistTutorial: user.adminWishlistTutorial,
          adminDistributionsTutorial: user.adminDistributionsTutorial,
          itemsTutorial: user.itemsTutorial,
          requestsTutorial: user.requestsTutorial,
          wishlistsTutorial: user.wishlistsTutorial,
          siteName: 
            user.type === "PARTNER" && user.partnerDetails
              ? (user.partnerDetails as { siteName?: string })?.siteName
              : undefined, 
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id || "";
        token.type = user.type;
        token.enabled = user.enabled;
        token.pending = user.pending;
        token.name = user.name ?? user.email ?? `User ${user.id}`;
        token.streamUserId = user.streamUserId;
        token.streamUserToken = user.streamUserToken;
        token.tag = user.tag;
        token.siteName = user.siteName;
        PERMISSION_FIELDS.forEach((field) => {
          token[field] = user[field];
        });
        token.dashboardTutorial = user.dashboardTutorial;
        token.adminDashboardTutorial = user.adminDashboardTutorial;
        token.adminSupportTutorial = user.adminSupportTutorial;
        token.adminAccountManagementTutorial =
          user.adminAccountManagementTutorial;
        token.adminUnallocatedTutorial = user.adminUnallocatedTutorial;
        token.adminDonorOffersTutorial = user.adminDonorOffersTutorial;
        token.adminWishlistTutorial = user.adminWishlistTutorial;
        token.adminDistributionsTutorial = user.adminDistributionsTutorial;
        token.itemsTutorial = user.itemsTutorial;
        token.requestsTutorial = user.requestsTutorial;
        token.wishlistsTutorial = user.wishlistsTutorial;
      }

      // Keep tutorial flags in sync when useSession().update(...) is called client-side.
      if (trigger === "update" && session) {
        const tutorialFields = [
          "dashboardTutorial",
          "adminDashboardTutorial",
          "adminSupportTutorial",
          "adminAccountManagementTutorial",
          "adminUnallocatedTutorial",
          "adminDonorOffersTutorial",
          "adminWishlistTutorial",
          "adminDistributionsTutorial",
          "itemsTutorial",
          "requestsTutorial",
          "wishlistsTutorial",
        ] as const;

        tutorialFields.forEach((field) => {
          const value = session[field];
          if (typeof value === "boolean") {
            token[field] = value;
          }
        });
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.type = token.type;
      session.user.enabled = token.enabled;
      session.user.pending = token.pending;
      session.user.name = token.name;
      session.user.streamUserId = token.streamUserId;
      session.user.streamUserToken = token.streamUserToken;
      session.user.tag = token.tag;
      session.user.siteName = token.siteName; 
      PERMISSION_FIELDS.forEach((field) => {
        session.user[field] = Boolean(token[field]);
      });
      session.user.dashboardTutorial = Boolean(token.dashboardTutorial);
      session.user.adminDashboardTutorial = Boolean(token.adminDashboardTutorial);
      session.user.adminSupportTutorial = Boolean(token.adminSupportTutorial);
      session.user.adminAccountManagementTutorial = Boolean(
        token.adminAccountManagementTutorial
      );
      session.user.adminUnallocatedTutorial = Boolean(
        token.adminUnallocatedTutorial
      );
      session.user.adminDonorOffersTutorial = Boolean(
        token.adminDonorOffersTutorial
      );
      session.user.adminWishlistTutorial = Boolean(token.adminWishlistTutorial);
      session.user.adminDistributionsTutorial = Boolean(
        token.adminDistributionsTutorial
      );
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
