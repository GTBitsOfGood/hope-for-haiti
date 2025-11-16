"use client";

import { useUser } from "@/components/context/UserContext";
import { isStaff, isPartner } from "@/lib/userUtils";
import AdminDashboardScreen from "@/screens/dashboard/AdminDashboardScreen";
import PartnerDashboardScreen from "@/screens/dashboard/PartnerDashboardScreen";
import LoadingScreen from "@/screens/LoadingScreen";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <LoadingScreen/>
    );
  }

  if (user && isStaff(user.type)) {
    return <AdminDashboardScreen />;
  }

  if (user && isPartner(user.type)) {
    return <PartnerDashboardScreen />;
  }

  redirect("/login");
}
