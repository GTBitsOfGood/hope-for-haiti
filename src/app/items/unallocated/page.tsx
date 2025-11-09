"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminUnallocatedItemsScreen from "@/screens/AdminUnallocatedItemsScreen";
import { hasPermission, isPartner } from "@/lib/userUtils";

export default function UnallocatedItemsPage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  // Partners should use the unified items screen at /items instead
  if (isPartner(session.user.type)) {
    redirect("/");
  }

  if (hasPermission(session.user, "allocationRead")) {
    return <AdminUnallocatedItemsScreen />;
  }

  redirect("/");
}
