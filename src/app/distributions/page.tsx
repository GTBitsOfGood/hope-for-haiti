"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminDistributionsScreen from "@/screens/AdminDistributionsScreen";
import { hasAnyPermission } from "@/lib/userUtils";

export default function DistributionsPage() {
  const { data: session } = useSession();

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  if (session.user.type === "PARTNER") {
    redirect("/");
  }

  if (
    hasAnyPermission(session.user, ["distributionRead", "shipmentRead"])
  ) {
    return <AdminDistributionsScreen />;
  }

  redirect("/");
}
