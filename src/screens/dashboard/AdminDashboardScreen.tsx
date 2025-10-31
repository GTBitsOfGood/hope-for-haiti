"use client";

import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import MapSection from "@/components/dashboard/MapSection";
import { generateMockNotifications } from "@/components/dashboard/types";
import {
  mockAnalyticsData,
  mockPartnerLocations,
} from "@/components/dashboard/analyticsData";
import { useState } from "react";

export default function AdminDashboardScreen() {
  const { user, loading } = useUser();
  const [notifications] = useState(generateMockNotifications());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin(user.type)) {
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

      <AnalyticsSection widgets={mockAnalyticsData} />

      <MapSection partners={mockPartnerLocations} />
    </div>
  );
}
