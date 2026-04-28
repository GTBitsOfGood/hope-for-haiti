"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminRequestsScreen from "@/screens/AdminRequestsScreen";
import { hasPermission } from "@/lib/userUtils";

export default function AdminRequestsPage() {
  const { data: session } = useSession();

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  if (session.user.type === "PARTNER") {
    redirect("/");
  }

  if (hasPermission(session.user, "requestRead")) {
    return <AdminRequestsScreen />;
  }

  redirect("/");
}
