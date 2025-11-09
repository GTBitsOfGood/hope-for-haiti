"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { hasAnyPermission, isPartner } from "@/lib/userUtils";
import AdminDonorOffersScreen from "@/screens/DonorOffersScreens/AdminDonorOffersScreen";

export default function DonorOffersPage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  // Partners should use the unified items screen at /items instead
  if (isPartner(session.user.type)) {
    redirect("/");
  }

  if (
    hasAnyPermission(session.user, [
      "requestRead",
      "requestWrite",
      "allocationRead",
      "archivedRead",
      "offerWrite",
    ])
  ) {
    return <AdminDonorOffersScreen />;
  }

  redirect("/");
}
