"use client";

import { useSession } from "next-auth/react";
import React from "react";
import PartnerDonorOffersScreen from "./PartnerDonorOffersScreen";

export default function DonorOffersScreen() {
  const { data: session } = useSession();

  switch (session?.user.type) {
    case "PARTNER":
      return <PartnerDonorOffersScreen />;
    case "SUPER_ADMIN":
    case "ADMIN":
    case "STAFF":
    default:
      return (
        <>
          <h1 className="text-2xl font-semibold">Donor Offers</h1>
        </>
      );
  }
}
