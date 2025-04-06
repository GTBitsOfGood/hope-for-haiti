"use client";

import PartnerSignOffScreen from "@/screens/PartnerDistributionsScreenTables/ViewDistributionsOfSignOffScreen/PartnerSignOffScreen";
import { useSession } from "next-auth/react";

export default function DistributionsScreen() {
  const { data: session } = useSession();

  switch (session?.user.type) {
    case "PARTNER":
      return <PartnerSignOffScreen />;
    case "STAFF":
    case "ADMIN":
    case "SUPER_ADMIN":
    default:
      return <></>;
  }
}
