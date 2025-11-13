"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminAllocateDonorOfferScreen from "@/screens/DonorOffersScreens/AdminAllocateDonorOfferScreen";
import { hasPermission } from "@/lib/userUtils";

export default function DonorOffersAllocatePage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  if (hasPermission(session.user, "allocationWrite")) {
    return <AdminAllocateDonorOfferScreen />;
  }

  redirect("/");
}
