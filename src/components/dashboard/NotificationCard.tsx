import { useApiClient } from "@/hooks/useApiClient";
import { Warning, ChatsTeardrop } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Toast } from "react-hot-toast";
import toast from "react-hot-toast";
import { useNotifications } from "../NotificationHandler";

interface NotificationCardProps {
  id: number | string;
  message: string;
  dateCreated: Date; // Added this prop
  actionText?: string;
  actionUrl?: string;
  isChat?: boolean;
  hideAction?: boolean;
  t?: Toast;
}

export default function NotificationCard({
  id,
  message,
  dateCreated,
  actionText,
  actionUrl,
  isChat = false,
  t,
  hideAction,
}: NotificationCardProps) {
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;

    return "now";
  };

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

  const styles = isChat
    ? {
        container: "border-blue-primary/20 bg-blue-500/5",
        icon: "text-blue-primary/60",
        text: "text-blue-primary/80",
        time: "text-blue-primary",
        action:
          "text-blue-primary/80 border-blue-primary/80 hover:text-blue-primary/80",
        IconComponent: ChatsTeardrop,
      }
    : {
        container: "border-red-primary/20 bg-red-primary/5",
        icon: "text-red-primary/60",
        text: "text-red-primary/80",
        time: "text-red-primary",
        action:
          "text-red-primary/80 border-red-primary/80 hover:text-red-primary/80",
        IconComponent: Warning,
      };

  const { IconComponent } = styles;

  return (
    <div
      className={`rounded-[7.25px] px-4 py-3 flex items-start gap-3 border ${styles.container}`}
    >
      <IconComponent
        className={`flex-shrink-0 ${styles.icon}`}
        size={18}
        weight="fill"
      />
      <div className="flex-col flex flex-1 items-start">
        <div className="flex justify-between items-start w-full gap-2">
          <p className={`text-sm font-medium leading-tight ${styles.text}`}>
            {message}
          </p>
          <span
            className={`text-[10px] whitespace-nowrap font-medium mt-0.5 ${styles.time}`}
          >
            {formatTimeAgo(dateCreated)}
          </span>
        </div>
        {!hideAction && actionText && actionUrl && (
          <button
            onClick={() => handleClick(true)}
            className={`mt-2 text-xs rounded-[4px] font-medium border px-2 py-1 ${styles.action}`}
          >
            {actionText} <span className="ml-0.5">›</span>
          </button>
        )}
      </div>
    </div>
  );
}
