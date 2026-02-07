"use client";

import { useApiClient } from "@/hooks/useApiClient";
import { Warning, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Toast } from "react-hot-toast";
import toast from "react-hot-toast";
import { useNotifications } from "../NotificationHandler";

interface NotificationCardProps {
  id: number;
  message: string;
  actionText?: string;
  actionUrl?: string;
  t?: Toast;
  hideAction?: boolean;
}

export default function NotificationCard({
  id,
  message,
  actionText,
  actionUrl,
  t,
  hideAction,
}: NotificationCardProps) {
  const { apiClient } = useApiClient();
  const router = useRouter();
  const { refreshNotifications } = useNotifications();

  const handleClick = async (redirect: boolean) => {
    if (!actionUrl) return;

    if (id > 0) {
      try {
        await apiClient.patch(`/api/notifications/${id}?view=true`);
      } catch (error) {
        console.error(`Failed to PATCH notification ${id}: ${error}`)
      }
    }

    try {
      await refreshNotifications();
    } catch (error) {
      console.error("Failed to refresh notifications", error);
    }

    if (t) toast.dismiss(t.id);
    if (redirect) router.push(actionUrl);
  };

  return (
    <div className="rounded-[8px] px-4 py-3 flex items-center gap-3 border border-red-primary/[0.20] bg-red-primary/[0.05]">
      <Warning
        className="flex-shrink-0 text-red-primary/[0.50]"
        size={20}
        weight="fill"
      />
      <div className="flex-1 flex items-center">
        <p className="text-sm text-red-primary/[0.50]">{message}</p>
        {!hideAction && actionText && actionUrl && (
          <button
            onClick={() => handleClick(true)}
            className="text-sm font-medium ml-2 text-red-primary/[0.50] hover:text-red-primary/[0.70]"
          >
            {actionText} <span className="ml-1">›</span>
          </button>
        )}
      </div>
      <button
      onClick={() => handleClick(false)}
        className="ml-3 flex h-6 w-6 items-center justify-center rounded-full border border-red-primary/[0.30] text-red-primary/[0.60] transition-colors hover:bg-red-primary/[0.08] hover:text-red-primary"
        aria-label="Dismiss notification"
      >
        <X size={12} weight="bold" />
      </button>
    </div>
  );
}
