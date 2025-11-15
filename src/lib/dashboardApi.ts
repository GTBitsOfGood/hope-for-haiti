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
  topMedications: { category: string; totalValue: number }[];
  partnerCount: number;
  importWeight: number;
  topDonors: { donorName: string; value: number }[];
  breakdownByDonationType: Record<string, number>;
  topDonationCategories: Record<string, number>;
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
    type: "other" as const,
  }));
}

/**
 * Fetch analytics data and transform to widget format
 */
export async function fetchAnalytics(
  excludeTags: string[] = []
): Promise<DashboardWidget[]> {
  const queryParams = new URLSearchParams();
  if (excludeTags.length > 0) {
    queryParams.set("excludePartnerTags", excludeTags.join(","));
  }

  const url = `/api/dashboard/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await fetch(url);
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

  // Helper to format category name
  const formatCategoryName = (category: string): string => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper to format item type name
  const formatItemTypeName = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
    // Top Donation Categories (Real Data)
    {
      id: "2",
      title: "Top Donation Categories",
      data: Object.entries(data.topDonationCategories).map(
        ([category, value]) => ({
          label: formatCategoryName(category),
          value: formatMillions(Number(value)),
        })
      ),
      orientation: "horizontal",
      axisTitleX: "Value (in millions)",
      type: "bar",
    },
    {
      id: "3",
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
      id: "5",
      title: "Top Five Medications Imported",
      data: data.topMedications.map((med) => ({
        label: formatCategoryName(med.category),
        value: formatMillions(med.totalValue),
      })),
      orientation: "horizontal",
      axisTitleX: "Value (in millions)",
      type: "bar",
    },
    // Total Imported By Value (Gauge)
    {
      id: "6",
      title: "Total Imported By Value",
      current: data.totalImports,
      goal: 25_000_000, // $25M goal
      label: "$25 M",
      textColor: "#0A7B40",
      type: "gauge",
    },
    // Total GIK Partners (Gauge)
    {
      id: "7",
      title: "Total GIK Partners",
      current: data.partnerCount,
      goal: 70,
      label: "70",
      textColor: "#8F6C1A",
      type: "gauge",
    },
    // Breakdown by Donation Type (Real Data)
    {
      id: "8",
      title: "Breakdown by Donation Type",
      data: Object.entries(data.breakdownByDonationType).map(
        ([type, count]) => ({
          name: formatItemTypeName(type),
          value: Number(count),
        })
      ),
      type: "pie",
    },
    // Total GIK $ Amount Imported (Monthly Bar Chart)
    {
      id: "9",
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
