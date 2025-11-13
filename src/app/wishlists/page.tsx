"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { hasPermission, isPartner } from "@/lib/userUtils";
import AdminWishlistScreen from "@/screens/Wishlist/AdminWishlistScreen";
import PartnerWishlistScreen from "@/screens/Wishlist/PartnerWishlistScreen";

export default function WishlistsPage() {
	const { data: session } = useSession();

	if (!session?.user?.type) {
		redirect("/signIn");
	}

	if (hasPermission(session.user, "wishlistRead")) {
		return <AdminWishlistScreen />;
	}

	if (isPartner(session.user.type)) {
		return <PartnerWishlistScreen />;
	}

	redirect("/");
}
