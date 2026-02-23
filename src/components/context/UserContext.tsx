"use client";

import { UserType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { PermissionFlags } from "@/types/api/user.types";

export type SessionUser = PermissionFlags & {
  id: string;
  type: UserType;
  name: string | null | undefined;
  streamUserToken: string | null;
  streamUserId: string | null;
  tag?: string;
  dashboardTutorial: boolean;
  itemsTutorial: boolean;
  requestsTutorial: boolean;
  wishlistsTutorial: boolean;
};

interface UseUserType {
  loading: boolean;
  user: SessionUser | null;
}

export const useUser = (): UseUserType => {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = (session?.user as SessionUser) || null;

  return { loading, user };
};
