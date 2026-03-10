"use client";

import Ably, { Message } from "ably";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useUser } from "./context/UserContext";
import { Notification } from "@prisma/client";
import toast, { Toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import { NotificationCard } from "./dashboard";
import { StreamChat, Event as StreamEvent } from "stream-chat";

let realtimeInstance: Ably.Realtime | null = null;

export type UnifiedNotification = {
  id: string | number;
  title: string;
  action?: string | null;
  actionText?: string | null;
  dateCreated: Date;
  isChat?: boolean;
};

function getRealtimeClient() {
  if (typeof window === "undefined") return null;
  if (!realtimeInstance) {
    realtimeInstance = new Ably.Realtime({
      authUrl: "/api/ably",
      autoConnect: false,
    });
  }
  return realtimeInstance;
}

const NotificationContext = createContext<{
  notifications: UnifiedNotification[];
  refreshNotifications: () => Promise<void>;
  dismissNotification: (id: string | number) => Promise<void>;
}>({
  notifications: [],
  refreshNotifications: async () => {},
  dismissNotification: async () => {},
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);

  // Ensure that mirroring doesn't overwrite sessionStorage before loading
  const isHydrated = useRef(false);

  useEffect(() => {
    const realtime = getRealtimeClient();
    if (!realtime) return;
    setClient(realtime);
    if (realtime.connection.state === "initialized") realtime.connect();
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("chat_notifications");
      if (stored) {
        const parsed: UnifiedNotification[] = JSON.parse(stored);
        // Re-instantiate dateCreated using new Date() as JSON serialization turns dates into strings
        const hydrated = parsed.map((n) => ({
          ...n,
          dateCreated: new Date(n.dateCreated),
        }));
        setNotifications((prev) => [...hydrated, ...prev]);
      }
    } catch (error) {
      console.error("Failed to hydrate chat notifications:", error);
    } finally {
      isHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isHydrated.current) return;
    const chatNotifications = notifications.filter((n) => n.isChat);
    try {
      sessionStorage.setItem(
        "chat_notifications",
        JSON.stringify(chatNotifications)
      );
    } catch (e) {
      console.error(
        "Failed to mirror chat notifications to sessionStorage:",
        e
      );
    }
  }, [notifications]);

  const dismissNotification = useCallback(
    async (id: string | number) => {
      const notification = notifications.find((n) => n.id === id);
      if (!notification?.isChat && Number(id) > 0) {
        try {
          await apiClient.delete(`/api/notifications/${id}`);
        } catch (error) {
          console.error(`Failed to delete notification ${id}: ${error}`);
        }
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [apiClient, notifications]
  );

  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem("chat_notifications");
    }
  }, [user]);

  useEffect(() => {
    const currentUrl = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    setNotifications((prev) =>
      prev.filter((n) => !n.isChat || n.action !== currentUrl)
    );
  }, [pathname, searchParams]);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await apiClient.get<{ notifications: Notification[] }>(
        "/api/notifications"
      );

      const mapped = data.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        action: n.action ?? undefined,
        actionText: n.actionText ?? undefined,
        dateCreated: new Date(n.dateCreated),
        isChat: false,
      }));

      setNotifications((prev) => {
        const chatNotifs = prev.filter((n) => n.isChat);
        return [...chatNotifs, ...mapped];
      });
    } catch (error) {
      console.error(`Failed to fetch notifications: ${error}`);
    }
  }, [apiClient, user?.id]);

  useEffect(() => {
    if (!user?.id || !client) return;
    refreshNotifications();

    const handleRealtimeNotification = async (message: Message) => {
      const payload = message.data as Notification;
      if (!payload) return;

      if (payload.id > 0) {
        try {
          const viewed = pathname === payload.action ? "&view=true" : "";
          await apiClient.patch(
            `/api/notifications/${payload.id}?delivery=true${viewed}`
          );
        } catch (error) {
          console.error(`Failed to PATCH notification ${payload.id}: ${error}`);
        }
      }

      setNotifications((prev) => [
        {
          id: payload.id,
          title: payload.title,
          action: payload.action ?? undefined,
          actionText: payload.actionText ?? undefined,
          dateCreated: new Date(payload.dateCreated),
          isChat: false,
        },
        ...prev,
      ]);

      const isShipmentStatusUpdate =
        payload.title?.toLowerCase().includes("shipment status") ||
        payload.actionText?.toLowerCase().includes("shipment") ||
        payload.action?.includes("distributions");

      if (isShipmentStatusUpdate) {
        window.dispatchEvent(new Event("shipment-status-updated"));
      }

      if (pathname === "/login") return;

      toast.custom(
        (t: Toast) => (
          <NotificationCard
            id={payload.id}
            message={payload.title}
            dateCreated={new Date(payload.dateCreated)}
            actionText={payload.actionText ?? undefined}
            actionUrl={payload.action ?? undefined}
            t={t}
            hideAction={pathname === payload.action}
          />
        ),
        { duration: 20 * 1000, position: "top-right" }
      );
    };

    const channelName = `${process.env.NODE_ENV}:user:${user.id}`;
    const channel = client.channels.get(channelName);
    channel.subscribe("notification:new", handleRealtimeNotification);
    return () => {
      channel.unsubscribe("notification:new", handleRealtimeNotification);
    };
  }, [client, user?.id, pathname, apiClient, refreshNotifications, router]);

  useEffect(() => {
    if (
      !user?.streamUserId ||
      !user.streamUserToken ||
      !process.env.NEXT_PUBLIC_STREAMIO_API_KEY
    ) {
      return;
    }

    const streamClient = new StreamChat(
      process.env.NEXT_PUBLIC_STREAMIO_API_KEY
    );
    let didInterrupt = false;

    const handleTicketMessage = (event: StreamEvent) => {
      if (event.channel_type !== "ticket") {
        return;
      }

      const senderId = event.user?.id ?? event.message?.user?.id;
      if (senderId === user.streamUserId) {
        return;
      }

      const channelId = event.channel?.id ?? event.cid?.split(":")[1];

      if (!channelId) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (searchParams.get("activeTab") === "Unresolved") {
        return;
      }

      const text = event.message?.text?.trim();
      const channelName =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event.channel as any)?.name ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event.message?.channel as any)?.name ??
        "Support Ticket";

      setNotifications((prev) => [
        {
          id: event.message?.id ?? Date.now(),
          title: `${channelName}: ${text || "New message"}`,
          action: `/support?channel-id=${channelId}`,
          actionText: "Reply",
          dateCreated: new Date(),
          isChat: true,
        },
        ...prev,
      ]);

      toast.custom(
        (t: Toast) => (
          <NotificationCard
            id={event.message?.id ?? Date.now()}
            message={`${channelName}: ${text || "New message"}`}
            dateCreated={new Date()}
            actionText="Reply"
            actionUrl={`/support?channel-id=${channelId}`}
            t={t}
            isChat
          />
        ),
        { duration: 20 * 1000, position: "top-right" }
      );
    };

    streamClient
      .connectUser(
        {
          id: user.streamUserId,
          name: user.name ?? undefined,
        },
        user.streamUserToken
      )
      .then(() => {
        if (!didInterrupt) {
          streamClient.on("notification.message_new", handleTicketMessage);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to connect Stream client for notifications:",
          error
        );
      });

    return () => {
      didInterrupt = true;
      streamClient.off("notification.message_new", handleTicketMessage);
      streamClient
        .disconnectUser()
        .catch((error) =>
          console.error(
            "Failed to disconnect Stream notification client:",
            error
          )
        );
    };
  }, [
    pathname,
    router,
    searchParams,
    user?.name,
    user?.streamUserId,
    user?.streamUserToken,
  ]);

  const value = useMemo(
    () => ({ notifications, refreshNotifications, dismissNotification }),
    [notifications, refreshNotifications, dismissNotification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
