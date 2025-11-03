export interface Notification {
  id: string;
  message: string;
  actionText: string;
  actionUrl: string;
  timestamp: Date;
  type: "expiration" | "delay" | "allocation" | "other";
}

export function generateMockNotifications(): Notification[] {
  const notifications: Notification[] = [];

  notifications.push({
    id: "1",
    message: "Item Name is expiring soon",
    actionText: "Review item",
    actionUrl: "/unallocatedItems",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: "expiration",
  });

  notifications.push({
    id: "2",
    message: "There has been a delay in Donation 49583's delivery.",
    actionText: "Review shipping status",
    actionUrl: "/distributions",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: "delay",
  });

  notifications.push({
    id: "3",
    message: "Item Name is expiring soon",
    actionText: "Review item",
    actionUrl: "/unallocatedItems",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    type: "expiration",
  });

  notifications.push({
    id: "4",
    message: "There has been a delay in Donation 49583's delivery.",
    actionText: "Review shipping status",
    actionUrl: "/distributions",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    type: "delay",
  });

  return notifications;
}
