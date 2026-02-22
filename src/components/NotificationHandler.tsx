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
import FloatingNotification from "./dashboard/FloatingNotification";
import { useUser } from "./context/UserContext";
import { Notification } from "@prisma/client";
import toast, { Toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import { NotificationCard } from "./dashboard";
import TicketMessageToast, { TicketMessageNotification } from "./tickets/TicketMessageToast";
import { StreamChat, Event } from "stream-chat";

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
  refreshTick: number;
  bumpRefreshTick: () => void;
}>({
  notifications: [],
  refreshNotifications: async () => {},
  refreshTick: 0,
  bumpRefreshTick: () => {},
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
  const [refreshTick, setRefreshTick] = useState(0);

  const bumpRefreshTick = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const realtime = getRealtimeClient();
    if (!realtime) return;
    setClient(realtime);
    if (realtime.connection.state === "initialized") realtime.connect();
  }, []);

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
      setNotifications(mapped);
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

      const shouldRefresh =
        payload.title?.toLowerCase().includes("shipment") ||
        payload.action?.startsWith("/distributions") ||
        payload.action?.startsWith("/items");

      if (shouldRefresh) {
        bumpRefreshTick();
        router.refresh();
      }

      if (pathname === "/") {
        toast.custom(
          (t: Toast) => (
            <NotificationCard
              id={payload.id}
              message={payload.title}
              dateCreated={payload.dateCreated}
              actionText={payload.actionText ?? undefined}
              actionUrl={payload.action ?? undefined}
              t={t}
              hideAction={pathname === payload.action}
            />
          ),
          { duration: 60 * 1000 }
        );
      }
    }

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

    const streamClient = new StreamChat(process.env.NEXT_PUBLIC_STREAMIO_API_KEY);
    let didInterrupt = false;

    const handleTicketMessage = (event: Event) => {
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

      const payload: TicketMessageNotification = {
        channelId,
        channelName:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (event.channel as any)?.name ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (event.message?.channel as any)?.name ??
          "Support Ticket",
        messagePreview: text ? text : "Attachment",
        senderName:
          event.user?.name ??
          event.message?.user?.name ??
          "Support",
        url: `/support?channel-id=${channelId}`,
      };

      toast.custom(
        (t: Toast) => <TicketMessageToast notification={payload} t={t} />, { duration: 60 * 1000 }
      );
    };

    streamClient
      .connectUser({
          id: user.streamUserId,
          name: user.name ?? undefined,
        }, user.streamUserToken,
      )
      .then(() => {
        if (!didInterrupt) {
          streamClient.on("notification.message_new", handleTicketMessage);
        }
      })
      .catch((error) => {
        console.error("Failed to connect Stream client for notifications:", error);
      });

    return () => {
      didInterrupt = true;
      streamClient.off("notification.message_new", handleTicketMessage);
      streamClient
        .disconnectUser()
        .catch((error) =>
          console.error("Failed to disconnect Stream notification client:", error),
        );
    };
  }, [pathname, router, searchParams, user?.name, user?.streamUserId, user?.streamUserToken]);

  useEffect(() => {
    if (
      !user?.streamUserId ||
      !user.streamUserToken ||
      !process.env.NEXT_PUBLIC_STREAMIO_API_KEY
    )
      return;

    const streamClient = new StreamChat(
      process.env.NEXT_PUBLIC_STREAMIO_API_KEY
    );
    let didInterrupt = false;

    const handleTicketMessage = (event: Event) => {
      if (event.channel_type !== "ticket") return;

      const senderId = event.user?.id ?? event.message?.user?.id;
      if (senderId === user.streamUserId) return;

      const channelId = event.channel?.id ?? event.cid?.split(":")[1];
      if (!channelId || searchParams.get("activeTab") === "Unresolved") return;

      const text = event.message?.text?.trim();

      setNotifications((prev) => [
        {
          id: event.message?.id ?? Date.now(),
          title: `Ticket: ${text || "New message"}`,
          action: `/support?channel-id=${channelId}`,
          actionText: "Reply",
          dateCreated: new Date(),
          isChat: true,
        },
        ...prev,
      ]);

      // OLD NOTIFICATION TOAST STYLE

      // const payload: TicketMessageNotification = {
      //   channelId,
      //   channelName: (event.channel as any)?.name ?? "Support Ticket",
      //   messagePreview: text ? text : "Attachment",
      //   senderName: event.user?.name ?? "Support",
      //   url: `/support?channel-id=${channelId}`,
      // };

      // toast.custom(
      //   (t: Toast) => <TicketMessageToast notification={payload} t={t} />,
      //   { duration: 60 * 1000 }
      // );
    };

    streamClient
      .connectUser(
        { id: user.streamUserId, name: user.name ?? undefined },
        user.streamUserToken
      )
      .then(() => {
        if (!didInterrupt)
          streamClient.on("notification.message_new", handleTicketMessage);
      });

    return () => {
      didInterrupt = true;
      streamClient.off("notification.message_new", handleTicketMessage);
      streamClient.disconnectUser();
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
    () => ({ notifications, refreshNotifications, refreshTick, bumpRefreshTick }),
    [notifications, refreshNotifications, refreshTick, bumpRefreshTick]
  );

  return (
    <NotificationContext.Provider value={value}>
      <FloatingNotification notifications={notifications} />
      {children}
    </NotificationContext.Provider>
  );
}
