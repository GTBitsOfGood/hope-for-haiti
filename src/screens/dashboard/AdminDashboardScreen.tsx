"use client";

import { useNotifications } from "@/components/NotificationHandler";
import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import MapSection from "@/components/dashboard/MapSection";
import {
  fetchAnalytics,
  fetchPartnerLocations,
} from "@/lib/dashboardApi";
import type { DashboardWidget } from "@/components/dashboard/analyticsData";
import { useEffect, useState } from "react";

export default function AdminDashboardScreen() {
  const { user, loading: userLoading } = useUser();
  const { notifications } = useNotifications();
  const [analyticsWidgets, setAnalyticsWidgets] = useState<DashboardWidget[]>(
    []
  );
  const [partnerLocations, setPartnerLocations] = useState<
    { id: string; name: string; lat: number; lng: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading || !user || !isAdmin(user.type)) {
      return;
    }

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [analytics, partners] = await Promise.all([
          fetchAnalytics(),
          fetchPartnerLocations(),
        ]);

        setAnalyticsWidgets(analytics);
        setPartnerLocations(partners);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, userLoading]);

  if (userLoading || loading) {
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-primary text-white rounded-lg hover:bg-blue-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <NotificationsSection notifications={notifications} />

      <AnalyticsSection widgets={analyticsWidgets} />

      <MapSection partners={partnerLocations} />
    </div>
  );
}
