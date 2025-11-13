"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerRequestsScreen from "@/screens/PartnerRequestsScreen";
import { isPartner } from "@/lib/userUtils";

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
