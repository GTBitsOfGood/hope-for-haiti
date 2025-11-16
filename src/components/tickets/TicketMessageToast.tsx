"use client";

import { useRouter } from "next/navigation";
import toast, { Toast } from "react-hot-toast";

export interface TicketMessageNotification {
  channelId: string;
  channelName: string;
  messagePreview: string;
  senderName: string;
  url: string;
}

interface TicketMessageToastProps {
  notification: TicketMessageNotification;
  t: Toast;
}

export default function TicketMessageToast({
  notification,
  t,
}: TicketMessageToastProps) {
  const router = useRouter();

  return (
    <div className="max-w-sm rounded-lg border border-gray-primary/20 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold uppercase text-gray-primary/60">
        New ticket message
      </p>
      <p className="mt-1 text-sm font-medium text-gray-primary">
        {notification.channelName}
      </p>
      <p className="mt-1 text-sm text-gray-primary/80">
        <span className="font-semibold">{notification.senderName}:</span>{" "}
        {notification.messagePreview}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            router.push(notification.url);
            toast.dismiss(t.id);
          }}
          className="flex-1 rounded-md bg-red-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-primary/90"
        >
          View ticket
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
          }}
          className="rounded-md border border-gray-primary/30 px-3 py-1.5 text-sm font-medium text-gray-primary transition hover:bg-gray-primary/5"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
