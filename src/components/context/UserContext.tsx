"use client";

import { UserType } from "@prisma/client";
import { useSession } from "next-auth/react";

interface SessionUser {
  id: string;
  type: UserType;
}

interface UseUserType {
  loading: boolean;
  user: SessionUser | null;
}

export const useUser = (): UseUserType => {
  const { data: session, status } = useSession();
  const loading = status === "loading" ? true : false;
  const user = session?.user || null;

  return { loading, user };
};
