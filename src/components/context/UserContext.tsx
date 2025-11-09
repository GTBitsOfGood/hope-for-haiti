"use client";

import { UserType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { PermissionFlags } from "@/types/api/user.types";

export type SessionUser = PermissionFlags & {
  id: string;
  type: UserType;
  tag?: string;
  enabled: boolean;
  name?: string | null;
  email?: string | null;
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
