"use client";

import { useUser } from "@/components/context/UserContext";
import { isAdmin, isPartner } from "@/lib/userUtils";
import LoadingScreen from "@/screens/LoadingScreen";
import AdminDashboardScreen from "@/screens/dashboard/AdminDashboardScreen";
import PartnerDashboardScreen from "@/screens/dashboard/PartnerDashboardScreen";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <LoadingScreen/>
    );
  }

  if (user && isAdmin(user.type)) {
    return <AdminDashboardScreen />;
  }

  if (user && isPartner(user.type)) {
    return <PartnerDashboardScreen />;
  }

  redirect("/login");
}
