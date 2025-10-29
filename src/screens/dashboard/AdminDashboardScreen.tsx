"use client";

import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import { generateMockNotifications } from "@/components/dashboard/types";
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

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Analytics</h2>
        <hr className="mb-4 border-gray-200" />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Map</h2>
        <hr className="mb-4 border-gray-200" />
      </div>
    </div>
  );
}
