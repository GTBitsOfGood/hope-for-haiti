"use client";

import React from "react";
import { useSession } from "next-auth/react";
import PartnerDistributionsScreen from "./PartnerDistributionsScreen";
import AdminDistributionsScreen from "./AdminDistributionsScreen";

export default function DistributionsScreen() {
  const { data: session } = useSession();

  switch (session?.user.type) {
    case "PARTNER":
      return <PartnerDistributionsScreen />;
    case "STAFF":
    case "ADMIN":
    case "SUPER_ADMIN":
      return <AdminDistributionsScreen />;
    default:
      return <></>;
  }
}
