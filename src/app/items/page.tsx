"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isPartner } from "@/lib/userUtils";
import PartnerItemsScreen from "@/screens/PartnerItemsScreen";

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
