"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isStaff } from "@/lib/userUtils";
import AdminWishlistScreen from "@/screens/Wishlist/AdminWishlistScreen";
import PartnerWishlistScreen from "@/screens/Wishlist/PartnerWishlistScreen";

export default function WishlistsPage() {
	const { data: session } = useSession();

	if (!session?.user?.type) {
		redirect("/signIn");
	}

	if (isStaff(session.user.type)) {
		return <AdminWishlistScreen />;
	}

	// Partner sees their own wishlist
	return <PartnerWishlistScreen />;
}

