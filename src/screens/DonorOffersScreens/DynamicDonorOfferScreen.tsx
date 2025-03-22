"use client";

import { useSession } from "next-auth/react";
import React from "react";
import PartnerDynamicDonorOfferScreen from "./PartnerDynamicDonorOfferScreen";

export default function DynamicDonorOfferScreen() {
  const { data: session } = useSession();

  switch (session?.user.type) {
    case "PARTNER":
      return <PartnerDynamicDonorOfferScreen />;
    case "SUPER_ADMIN":
    case "ADMIN":
    case "STAFF":
    default:
      return (
        <>
          <h1 className="text-2xl font-semibold">Donor Offer</h1>
        </>
      );
  }
}
