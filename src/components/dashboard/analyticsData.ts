// Mock data for analytics dashboard

export interface MetricWidget {
  id: string;
  title: string;
  value: string;
  type: "metric";
}

export interface MetricGroupWidget {
  id: string;
  title: string;
  metrics: { title: string; value: string }[];
  type: "metricGroup";
}

export interface LeaderboardWidget {
  id: string;
  title: string;
  items: { name: string; value: number }[];
  type: "leaderboard";
}

export interface BarChartWidget {
  id: string;
  title: string;
  data: { label: string; value: number }[];
  orientation: "horizontal" | "vertical";
  axisTitleX?: string;
  axisTitleY?: string;
  type: "bar";
}

export interface GaugeWidget {
  id: string;
  title: string;
  current: number;
  goal: number;
  label: string;
  textColor?: string;
  type: "gauge";
}

export interface PieChartWidget {
  id: string;
  title: string;
  data: { name: string; value: number }[];
  type: "pie";
}

export type DashboardWidget =
  | MetricWidget
  | MetricGroupWidget
  | LeaderboardWidget
  | BarChartWidget
  | GaugeWidget
  | PieChartWidget;

export const mockAnalyticsData: DashboardWidget[] = [
  {
    id: "1",
    title: "Overview Metrics",
    metrics: [
      { title: "Total Pallets", value: "164" },
      { title: "Total Delivered", value: "$26,254,101" },
      { title: "Total Shipments", value: "24" },
      { title: "Total Imported by Weight", value: "141,123 lbs" },
    ],
    type: "metricGroup",
  },
  {
    id: "2",
    title: "Top Donation Categories",
    items: [
      { name: "General Medicine", value: 2987 },
      { name: "Cancer", value: 3243 },
      { name: "Menstrual Hygiene", value: 4352 },
      { name: "Antibiotic", value: 2345 },
      { name: "Recreation", value: 1257 },
    ],
    type: "leaderboard",
  },
  {
    id: "3",
    title: "Top Three GIK Donors",
    data: [
      { label: "Americares", value: 8.2 },
      { label: "MAP", value: 6.9 },
      { label: "IMRES", value: 4.5 },
    ],
    orientation: "horizontal",
    axisTitleX: "Value (in millions)",
    type: "bar",
  },
  {
    id: "5",
    title: "Top Five Medications Imported",
    data: [
      { label: "Cardiovascular", value: 6.44 },
      { label: "Gastroenterology", value: 4.32 },
      { label: "Dermatology", value: 3.21 },
      { label: "Diabetes", value: 2.98 },
      { label: "Neurological", value: 2.45 },
    ],
    orientation: "horizontal",
    axisTitleX: "Value (in millions)",
    type: "bar",
  },
  {
    id: "6",
    title: "Total Imported By Value",
    current: 26254101,
    goal: 25000000,
    label: "$25 M",
    textColor: "#0A7B40",
    type: "gauge",
  },
  {
    id: "7",
    title: "Total GIK Partners",
    current: 67,
    goal: 70,
    label: "70",
    textColor: "#8F6C1A",
    type: "gauge",
  },
  {
    id: "8",
    title: "Breakdown by Donation Type",
    data: [
      { name: "Medical", value: 127 },
      { name: "Medical Supplement", value: 35 },
      { name: "Non-Medical", value: 22 },
    ],
    type: "pie",
  },
  {
    id: "9",
    title: "Total GIK $ Amount Imported",
    data: [
      { label: "Jul", value: 5200000 },
      { label: "Aug", value: 45000 },
      { label: "Sept", value: 45000 },
      { label: "Oct", value: 4000000 },
      { label: "Nov", value: 186000 },
      { label: "Dec", value: 108000 },
      { label: "Jan", value: 1500000 },
      { label: "Feb", value: 2100000 },
      { label: "Mar", value: 3200000 },
      { label: "Apr", value: 186000 },
      { label: "May", value: 2100000 },
      { label: "Jun", value: 6800000 },
    ],
    orientation: "vertical",
    type: "bar",
  },
];

export interface PartnerLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const mockPartnerLocations: PartnerLocation[] = [
  {
    id: "1",
    name: "Hôpital Universitaire de Mirebalais",
    lat: 18.8333,
    lng: -72.1053,
  },
  { id: "2", name: "St. Boniface Hospital", lat: 18.4597, lng: -72.5831 },
  { id: "3", name: "Hôpital Saint-Michel", lat: 18.2333, lng: -72.5333 },
  { id: "4", name: "Partners In Health", lat: 18.5419, lng: -72.3344 },
  { id: "5", name: "Missionary Medicine Haiti", lat: 18.5167, lng: -72.3333 },
  { id: "6", name: "L'Hôpital Sainte-Thérèse", lat: 18.5833, lng: -73.45 },
];
