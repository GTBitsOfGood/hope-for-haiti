"use client";

import Ably, { Message } from "ably";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUser } from "./context/UserContext";
import { Notification } from "@prisma/client";
import toast, { Toast } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import { NotificationCard } from "./dashboard";

let realtimeInstance: Ably.Realtime | null = null;

function getRealtimeClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!realtimeInstance) {
    realtimeInstance = new Ably.Realtime({
      authUrl: "/api/ably",
      autoConnect: false,
    });
  }

  return realtimeInstance;
}

const NotificationContext = createContext<{
  notifications: Notification[];
  refreshNotifications: () => Promise<void>;
}>({
  notifications: [],
  refreshNotifications: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export default function NotificationHandler({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useUser();
  const { apiClient } = useApiClient();
  const pathname = usePathname();
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const realtime = getRealtimeClient();
    if (!realtime) {
      return;
    }

    setClient(realtime);

    if (realtime.connection.state === "initialized") {
      realtime.connect();
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const data = await apiClient.get<{ notifications: Notification[] }>(
        "/api/notifications"
      );
      setNotifications(data.notifications);
    } catch (error) {
      console.error(`Failed to fetch notifications: ${error}`);
    }
  }, [apiClient, user?.id]);

  useEffect(() => {
    if (!user?.id || !client) {
      return;
    }
    refreshNotifications();

    const handleRealtimeNotification = async (message: Message) => {
      const payload = message.data as Notification;
      if (!payload) {
        return;
      }

      try {
        const viewed = pathname === payload.action ? "&view=true" : ""; 
        await apiClient.patch(`/api/notifications/${payload.id}?delivery=true${viewed}`);
      } catch (error) {
        console.error(`Failed to PATCH notification ${payload.id}: ${error}`)
      }

      setNotifications((prev) => {
        return [payload, ...prev];
      });

      if (pathname === "/") return;

      toast.custom((t: Toast) => (
        <NotificationCard 
          id={payload.id}
          message={payload.title} 
          actionText={payload.actionText ?? undefined} 
          actionUrl={payload.action ?? undefined} 
          t={t}
          hideAction={pathname === payload.action}
        />
      ), {duration: 60 * 1000}); // 60 seconds
    };

    const channelName = `${process.env.NODE_ENV}:user:${user.id}`;
    const channel = client.channels.get(channelName);

    channel.subscribe("notification:new", handleRealtimeNotification);
    return () => {
      channel.unsubscribe("notification:new", handleRealtimeNotification);
    };
  }, [client, user?.id, pathname, apiClient, refreshNotifications]);

  const value = useMemo(
    () => ({ notifications, refreshNotifications }),
    [notifications, refreshNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
