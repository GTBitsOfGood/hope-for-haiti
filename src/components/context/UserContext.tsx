"use client";

import { UserType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { createContext, useContext, ReactNode, FC } from "react";

interface SessionUser {
  id: string;
  type: UserType;
}

interface UserContextType {
  loading: boolean;
  user: SessionUser | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const UserProvider: FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const loading = status === "loading" ? true : false;
  const user = session?.user || null;

  return (
    <UserContext.Provider value={{ loading, user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
