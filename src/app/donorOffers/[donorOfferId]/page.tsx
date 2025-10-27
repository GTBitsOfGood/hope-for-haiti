"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isStaff, isPartner } from "@/lib/userUtils";
import AdminDynamicDonorOfferScreen from "@/screens/DonorOffersScreens/AdminDynamicDonorOfferScreen";

export default function DonorOfferDetailsPage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  // Partners should use the unified items screen at /items instead
  if (isPartner(session.user.type)) {
    redirect("/");
  }

  if (isStaff(session.user.type)) {
    return <AdminDynamicDonorOfferScreen />;
  }

  redirect("/signIn");
}
