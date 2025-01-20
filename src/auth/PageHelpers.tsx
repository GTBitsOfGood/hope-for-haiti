import { useUser } from "@/components/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Authenticated({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (!user) router.replace("/sign_in");
  }, [router, user]);

  if (user) return children;
  return <></>;
}

export function Unauthenticated({
  children,
  redirect,
}: Readonly<{
  children: React.ReactNode;
  redirect: string;
}>) {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) router.push(redirect);
  }, [router, user, redirect]);

  if (!user) return children;
  return <></>;
}
