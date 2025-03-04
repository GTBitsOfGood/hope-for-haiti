"use client";

import React from "react";
import { useSession } from "next-auth/react";
import PartnerUnallocatedItemsScreen from "./PartnerUnallocatedItemsScreen";

export default function UnallocatedItemsScreen() {
  const { data: session } = useSession();

  switch (session?.user.type) {
    case "PARTNER":
      return <PartnerUnallocatedItemsScreen />;
    case "STAFF":
    case "ADMIN":
    case "SUPER_ADMIN":
      return <></>;
    default:
      return <></>;
  }
}
