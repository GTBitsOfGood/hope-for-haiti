"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/userUtils";
import PartnerDonorOffersScreen from "@/screens/DonorOffersScreens/PartnerDonorOffersScreen";
import AdminDonorOffersScreen from "@/screens/DonorOffersScreens/AdminDonorOffersScreen";

export default function DonorOffersPage() {
  const { data: session } = useSession();

  if (!session?.user.type) {
    redirect("/signIn");
  }

  if (isStaff(session.user.type)) {
    return <AdminDonorOffersScreen />;
  }

  if (session.user.type === "PARTNER") {
    return <PartnerDonorOffersScreen />;
  }

  redirect("/signIn");
}
