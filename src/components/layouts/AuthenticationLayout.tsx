"use client";

import { SessionProvider } from "next-auth/react";
import { useUser } from "../context/UserContext";
import LoadingPage from "@/screens/LoadingScreen";

function AuthenticationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { loading } = useUser();

  if (loading)
    return (
      <body>
        <LoadingPage />
      </body>
    );

  return children;
}

export default function RootAuthenticationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <AuthenticationLayout>{children}</AuthenticationLayout>
    </SessionProvider>
  );
}
