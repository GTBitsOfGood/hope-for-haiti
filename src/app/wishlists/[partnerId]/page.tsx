"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerWishlistScreen from "@/screens/Wishlist/PartnerWishlistScreen";
import { isStaff } from "@/lib/userUtils";

export default function PartnerWishlistPage() {
  const params = useParams();
  const partnerId = Number(params?.partnerId);

  const { data: session } = useSession();
  if (!session?.user?.type) {
    redirect("/signIn");
  }

  // Only staff or above can access arbitrary partnerId; partners should use /wishlists
  if (!isStaff(session.user.type)) {
    redirect("/wishlists");
  }

  return <PartnerWishlistScreen partnerId={partnerId} readOnly />;
}
