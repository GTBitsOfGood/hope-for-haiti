import type { DashboardWidget } from "@/components/dashboard/analyticsData";
import type { Notification } from "@/components/dashboard/types";

// Backend notification type
interface BackendNotification {
  id: number;
  title: string;
  action: string | null;
  actionText: string | null;
  dateCreated: Date | string;
  dateViewed: Date | string | null;
  userId: number;
}

// Backend analytics response type
interface BackendAnalyticsResponse {
  totalImports: number;
  monthlyImportTotals: { month: number; year: number; total: number }[];
  totalShipments: number;
  totalPallets: number;
  topMedications: { title: string; totalValue: number }[];
  partnerCount: number;
  importWeight: number;
  topDonors: { donorName: string; value: number }[];
}

// Backend partner location type
interface BackendPartnerLocation {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Fetch unread notifications for the current user
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const response = await fetch("/api/notifications");
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  const data = await response.json();
  const backendNotifications: BackendNotification[] = data.notifications;

  // Transform backend notifications to frontend format
  return backendNotifications.map((notif) => ({
    id: String(notif.id),
    message: notif.title,
    actionText: notif.actionText || "View",
    actionUrl: notif.action || "#",
    timestamp: new Date(notif.dateCreated),
    type: "other" as const, // Default type, could be determined from notification content
  }));
}

/**
 * Fetch analytics data and transform to widget format
 */
export async function fetchAnalytics(): Promise<DashboardWidget[]> {
  const response = await fetch("/api/dashboard/analytics");
  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }
  const data: BackendAnalyticsResponse = await response.json();

  // Helper to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper to format weight
  const formatWeight = (lbs: number): string => {
    return `${Math.round(lbs).toLocaleString("en-US")} lbs`;
  };

  // Helper to format value in millions
  const formatMillions = (value: number): number => {
    return value / 1_000_000;
  };

  // Month abbreviations
  const monthAbbr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  const widgets: DashboardWidget[] = [
    // Metric Group: Overview Metrics
    {
      id: "1",
      title: "Overview Metrics",
      metrics: [
        { title: "Total Pallets", value: String(data.totalPallets) },
        {
          title: "Total Delivered",
          value: formatCurrency(data.totalImports),
        },
        { title: "Total Shipments", value: String(data.totalShipments) },
        {
          title: "Total Imported by Weight",
          value: formatWeight(data.importWeight),
        },
      ],
      type: "metricGroup",
    },
    // Top Three GIK Donors
    {
      id: "2",
      title: "Top Three GIK Donors",
      data: data.topDonors.map((donor) => ({
        label: donor.donorName,
        value: formatMillions(donor.value),
      })),
      orientation: "horizontal",
      axisTitleX: "Value (in millions)",
      type: "bar",
    },
    // Top Five Medications Imported
    {
      id: "3",
      title: "Top Five Medications Imported",
      data: data.topMedications.map((med) => ({
        label: med.title,
        value: formatMillions(med.totalValue),
      })),
      orientation: "horizontal",
      axisTitleX: "Value (in millions)",
      type: "bar",
    },
    // Total Imported By Value (Gauge)
    {
      id: "4",
      title: "Total Imported By Value",
      current: data.totalImports,
      goal: 25_000_000, // $25M goal
      label: "$25 M",
      textColor: "#0A7B40",
      type: "gauge",
    },
    // Total GIK Partners (Gauge)
    {
      id: "5",
      title: "Total GIK Partners",
      current: data.partnerCount,
      goal: 70,
      label: "70",
      textColor: "#8F6C1A",
      type: "gauge",
    },
    // Total GIK $ Amount Imported (Monthly Bar Chart)
    {
      id: "6",
      title: "Total GIK $ Amount Imported",
      data: data.monthlyImportTotals.map((month) => ({
        label: monthAbbr[month.month - 1],
        value: month.total,
      })),
      orientation: "vertical",
      type: "bar",
    },
  ];

  return widgets;
}

export async function fetchPartnerLocations(): Promise<
  { id: string; name: string; lat: number; lng: number }[]
> {
  const response = await fetch("/api/dashboard/geolocations");
  if (!response.ok) {
    throw new Error("Failed to fetch partner locations");
  }
  const data = await response.json();
  const backendLocations: BackendPartnerLocation[] = data.data;

  return backendLocations
    .filter(
      (loc) =>
        loc.latitude != null &&
        loc.longitude != null &&
        typeof loc.latitude === "number" &&
        typeof loc.longitude === "number"
    )
    .map((loc) => ({
      id: String(loc.id),
      name: loc.name,
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
    }));
}
