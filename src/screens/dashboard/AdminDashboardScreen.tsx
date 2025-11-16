"use client";

import { useNotifications } from "@/components/NotificationHandler";
import { useUser } from "@/components/context/UserContext";
import { isStaff } from "@/lib/userUtils";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import MapSectionWithData from "@/components/dashboard/MapSectionWithData";
import LoadingScreen from "@/screens/LoadingScreen";

export default function AdminDashboardScreen() {
  const { user, loading: userLoading } = useUser();
  const { notifications } = useNotifications();

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
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <NotificationsSection notifications={notifications} />

      <AnalyticsSection />

      <MapSectionWithData />
    </div>
  );
}
