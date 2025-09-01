"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerDistributionsScreen from "@/screens/PartnerDistributionsScreen";
import AdminDistributionsScreen from "@/screens/AdminDistributionsScreen";

export default function DistributionsPage() {
  const { data: session } = useSession();

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  switch (session.user.type) {
    case "PARTNER":
      return <PartnerDistributionsScreen />;
    case "STAFF":
    case "ADMIN":
    case "SUPER_ADMIN":
      return <AdminDistributionsScreen />;
    default:
      redirect("/signIn");
  }
}
