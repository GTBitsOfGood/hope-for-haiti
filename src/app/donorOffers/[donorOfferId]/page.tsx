"use client";

import { useSession } from "next-auth/react";
import { redirect, useParams } from "next/navigation";
import { isStaff, isPartner } from "@/lib/userUtils";
import AdminDynamicDonorOfferScreen from "@/screens/DonorOffersScreens/AdminDynamicDonorOfferScreen";
import AdminAllocateDonorOfferScreen from "@/screens/DonorOffersScreens/AdminAllocateDonorOfferScreen";
import AdminArchivedDonorOfferScreen from "@/screens/DonorOffersScreens/AdminArchivedDonorOfferScreen";
import { useFetch } from "@/hooks/useFetch";
import { DonorOffer } from "@prisma/client";

export default function DonorOfferDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const donorOfferId = params.donorOfferId as string;

  if (!session?.user.type) {
    redirect("/signIn");
  }

  // Partners should use the unified items screen at /items instead
  if (isPartner(session.user.type)) {
    redirect("/");
  }

  const { data, isLoading } = useFetch<{
    donorOffer: DonorOffer;
  }>(`/api/donorOffers/${donorOfferId}`, {
    cache: "no-store",
    onError: (error) => {
      if (error.includes("404")) {
        redirect("/donorOffers");
      }
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (isStaff(session.user.type)) {
    const { donorOffer } = data;
    
    // Render different screens based on donor offer state
    if (donorOffer.state === "UNFINALIZED") {
      return <AdminDynamicDonorOfferScreen />;
    } else if (donorOffer.state === "FINALIZED") {
      return <AdminAllocateDonorOfferScreen />;
    } else if (donorOffer.state === "ARCHIVED") {
      return <AdminArchivedDonorOfferScreen />;
    }
  }

  redirect("/signIn");
}
