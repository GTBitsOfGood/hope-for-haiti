"use client";

import { useNotifications } from "@/components/NotificationHandler";
import { useUser } from "@/components/context/UserContext";
import { isStaff, hasPermission } from "@/lib/userUtils";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import MapSectionWithData from "@/components/dashboard/MapSectionWithData";
import LoadingScreen from "@/screens/LoadingScreen";

export default function AdminDashboardScreen() {
  const { user, loading: userLoading } = useUser();
  const { notifications } = useNotifications();
  const hasUserRead = hasPermission(user, "userRead");

  if (userLoading) {
    return <LoadingScreen />;
  }

  if (!user || !isStaff(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">
        {hasUserRead ? "Admin Dashboard" : "Dashboard"}
      </h1>

      <NotificationsSection notifications={notifications} />

      <AnalyticsSection hasUserRead={hasUserRead} />

      <MapSectionWithData />
    </div>
  );
}
