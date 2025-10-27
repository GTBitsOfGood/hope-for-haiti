"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isPartner } from "@/lib/userUtils";
import PartnerRequestsScreen from "@/screens/PartnerRequestsScreen";

export default function RequestsPage() {
  const { data: session } = useSession();

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  if (!isPartner(session.user.type)) {
    redirect("/");
  }

  return <PartnerRequestsScreen />;
}
