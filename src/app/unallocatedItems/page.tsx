"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerUnallocatedItemsScreen from "@/screens/PartnerUnallocatedItemsScreen";
import AdminUnallocatedItemsScreen from "@/screens/AdminUnallocatedItemsScreen";
import { isStaff } from "@/lib/userUtils";

export default function UnallocatedItemsPage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  if (isStaff(session.user.type)) {
    return <AdminUnallocatedItemsScreen />;
  }

  if (session.user.type === "PARTNER") {
    return <PartnerUnallocatedItemsScreen />;
  }

  redirect("/signIn");
}
