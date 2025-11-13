"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import PartnerWishlistScreen from "@/screens/Wishlist/PartnerWishlistScreen";
import { hasPermission } from "@/lib/userUtils";

export default function PartnerWishlistPage() {
  const params = useParams();
  const partnerId = Number(params?.partnerId);

  const { data: session } = useSession();
  if (!session?.user?.type) {
    redirect("/signIn");
  }

  // Only users with wishlist access can view arbitrary partner wishlists
  if (!hasPermission(session.user, "wishlistRead")) {
    redirect("/wishlists");
  }

  return <PartnerWishlistScreen partnerId={partnerId} readOnly />;
}
