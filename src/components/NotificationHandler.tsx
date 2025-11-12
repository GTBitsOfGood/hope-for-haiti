"use client";

import Ably from "ably";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  client: Ably.Realtime | null;
  isConnected: boolean;
}>({
  client: null,
  isConnected: false,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export default function NotificationHandler({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const realtime = getRealtimeClient();
    if (!realtime) {
      return;
    }

    setClient(realtime);

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    realtime.connection.on("connected", handleConnected);
    realtime.connection.on("disconnected", handleDisconnected);

    if (realtime.connection.state === "initialized") {
      realtime.connect();
    } else if (realtime.connection.state === "connected") {
      setIsConnected(true);
    }

    return () => {
      realtime.connection.off("connected", handleConnected);
      realtime.connection.off("disconnected", handleDisconnected);
    };
  }, []);

  const value = useMemo(() => ({ client, isConnected }), [client, isConnected]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
