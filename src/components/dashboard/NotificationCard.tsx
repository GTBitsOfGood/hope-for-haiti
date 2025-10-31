"use client";

import { Warning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface NotificationCardProps {
  message: string;
  actionText: string;
  actionUrl?: string;
  onActionClick?: () => void;
}

export default function NotificationCard({
  message,
  actionText,
  actionUrl,
  onActionClick,
}: NotificationCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionUrl) {
      router.push(actionUrl);
    }
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
        <button
          onClick={handleClick}
          className="text-sm font-medium ml-2 text-red-primary/[0.50] hover:text-red-primary/[0.70]"
        >
          {actionText} <span className="ml-1">›</span>
        </button>
      </div>
    </div>
  );
}
