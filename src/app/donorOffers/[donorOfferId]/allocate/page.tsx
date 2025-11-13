"use client";

import { useParams, redirect } from "next/navigation";

// This route has been deprecated. All donor offer functionality
// is now handled at /donorOffers/[donorOfferId]
export default function DonorOffersAllocatePage() {
  const params = useParams();
  const donorOfferId = params.donorOfferId as string;
  
  // Redirect to the main donor offer page
  redirect(`/donorOffers/${donorOfferId}`);
}
