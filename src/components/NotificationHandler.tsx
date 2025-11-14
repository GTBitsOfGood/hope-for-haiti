"use client";

import Ably, { Message } from "ably";
import {
  createContext,
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

// const NotificationContext = createContext<{
//   client: Ably.Realtime | null;
//   isConnected: boolean;
// }>({
//   client: null,
//   isConnected: false,
// });

const NotificationContext = createContext<{
  notifications: Notification[];
}>({
  notifications: [],
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
  // const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const realtime = getRealtimeClient();
    if (!realtime) {
      return;
    }

    setClient(realtime);

    // const handleConnected = () => setIsConnected(true);
    // const handleDisconnected = () => setIsConnected(false);

    // realtime.connection.on("connected", handleConnected);
    // realtime.connection.on("disconnected", handleDisconnected);

    if (realtime.connection.state === "initialized") {
      realtime.connect();
    } else if (realtime.connection.state === "connected") {
      // setIsConnected(true);
    }

    return () => {
      // realtime.connection.off("connected", handleConnected);
      // realtime.connection.off("disconnected", handleDisconnected);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !client) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const data = await apiClient.get<{notifications: Notification[]}>("/api/notifications");
        setNotifications(data.notifications);
      } catch (error) {
        console.error(`Failed to fetch notifications: ${error}`)
      }
    }

    fetchNotifications();

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

    const channelName = `user:${user.id}`;
    const channel = client.channels.get(channelName);

    channel.subscribe("notification:new", handleRealtimeNotification);
    return () => {
      channel.unsubscribe("notification:new", handleRealtimeNotification);
    };
  }, [client, user?.id, pathname, apiClient]);

  const value = useMemo(() => ({ notifications }), [notifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
