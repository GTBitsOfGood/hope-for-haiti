"use client";

import { SessionProvider } from "next-auth/react";
import { useUser } from "./context/UserContext";
import LoadingScreen from "@/screens/LoadingScreen";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

function VerifyAuthentication({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();
  const { loading, user } = useUser();
  const router = useRouter();

  const onSignInPage = pathName === "/sign_in";

  useEffect(() => {
    if (loading) return;
    if (onSignInPage && user) router.replace("/");
    if (!onSignInPage && !user) router.replace("/sign_in");
  }, [onSignInPage, loading, user, router]);

  if (loading)
    return (
      <main className="w-screen h-screen">
        <LoadingScreen />
      </main>
    );

  if (!onSignInPage && !user) {
    return <></>;
  }

  return children;
}

export default function AuthenticationProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <VerifyAuthentication>{children}</VerifyAuthentication>
    </SessionProvider>
  );
}
