"use client";

import { SessionProvider } from "next-auth/react";
import { useUser } from "./context/UserContext";
import LoadingScreen from "@/screens/LoadingScreen";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function VerifyAuthentication({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathName = usePathname();
  const { loading, user } = useUser();
  const router = useRouter();
  const authPages = ["/signIn", "/register"];
  const globalPages = ["/reset-password", "/reset-password/change"];
  const onAuthPages = authPages.includes(pathName);
  const onGlobalPages = globalPages.includes(pathName);

  useEffect(() => {
    if (loading) return;
    if (onAuthPages && user) router.replace("/");
    if (!onAuthPages && !onGlobalPages && !user) router.replace("/signIn");
  }, [onAuthPages, onGlobalPages, loading, user, router]);

  if (loading)
    return (
      <main className="w-screen h-screen">
        <LoadingScreen />
      </main>
    );

  if (!onAuthPages && !user) {
    return <></>;
  }

  return children;
}

export default function AuthenticationProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <VerifyAuthentication>{children}</VerifyAuthentication>
    </SessionProvider>
  );
}
