"use client";

import { useParams } from "next/navigation";
import React, { useEffect } from "react";

export default function PartnerDynamicDonorOfferScreen() {
  const { donorOfferId } = useParams();

  useEffect(() => {
    setTimeout(async () => {
      // Fetch donor offer
      const response = await fetch(`/api/donorOffers/${donorOfferId}`, {
        method: "GET",
      });
      const data = await response.json();
      console.log(data);
    }, 1000);
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold">Donor Offer</h1>
    </>
  );
}
