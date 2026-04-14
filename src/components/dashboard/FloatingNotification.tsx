"use client";

import { useState } from "react";
import { Bell } from "@phosphor-icons/react";
import NotificationsPanel from "./NotificationsPanel";
import { useNotifications } from "../NotificationHandler";
import { useUser } from "../context/UserContext";

export default function FloatingNotification() {
  const { user } = useUser();
  const { notifications } = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // Don't show notification bell on login page or when not authenticated
  if (!user) return null;

  const unreadCount = notifications.length;

  return (
    <div className="fixed top-7 right-20 sm:right-9 w-12 h-12 flex justify-center items-center z-[50]">
      <button
        onClick={() => setIsPanelOpen(true)}
        className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 transition-all "
      >
        <div className="relative">
          <Bell size={28} weight="regular" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-primary text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      <NotificationsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}
