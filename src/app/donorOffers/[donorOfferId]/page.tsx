"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/userUtils";
import PartnerDynamicDonorOfferScreen from "@/screens/DonorOffersScreens/PartnerDynamicDonorOfferScreen";
import AdminDynamicDonorOfferScreen from "@/screens/DonorOffersScreens/AdminDynamicDonorOfferScreen";

export default function DonorOfferDetailsPage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  if (isStaff(session.user.type)) {
    return <AdminDynamicDonorOfferScreen />;
  }

  if (session.user.type === "PARTNER") {
    return <PartnerDynamicDonorOfferScreen />;
  }

  redirect("/signIn");
}
