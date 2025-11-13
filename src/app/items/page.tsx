"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerItemsScreen from "@/screens/PartnerItemsScreen";
import { isPartner } from "@/lib/userUtils";

export default function ItemsPage() {
  const { data: session } = useSession();

  if (!session?.user?.type) {
    redirect("/signIn");
  }

  if (!isPartner(session.user.type)) {
    redirect("/");
  }

  return <PartnerItemsScreen />;
}
