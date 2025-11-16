"use client";

import { useNotifications } from "@/components/NotificationHandler";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import PartnerDistributionsSection from "@/components/dashboard/PartnerDistributionsSection";

export default function PartnerDashboardScreen() {
  const { notifications } = useNotifications();

  return (
    <div className="space-y-6">
      <NotificationsSection notifications={notifications} />

      <PartnerDistributionsSection />
    </div>
  );
}
