"use client";

import { Warning } from "@phosphor-icons/react";

interface NotificationCardProps {
  message: string;
  actionText: string;
  onActionClick?: () => void;
}

export default function NotificationCard({
  message,
  actionText,
  onActionClick,
}: NotificationCardProps) {
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
          onClick={onActionClick}
          className="text-sm font-medium ml-2 text-[#AF131E]"
        >
          {actionText} <span className="ml-1">›</span>
        </button>
      </div>
    </div>
  );
}
