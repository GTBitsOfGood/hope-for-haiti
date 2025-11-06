"use client";

import SupportScreen from "@/screens/SupportScreen";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function SupportPage() {
  const { data: session } = useSession();

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  return <SupportScreen />;
}
