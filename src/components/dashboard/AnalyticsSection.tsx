"use client";

import DashboardWidget from "./widgets/DashboardWidget";
import type { DashboardWidget as WidgetType } from "./analyticsData";

interface AnalyticsSectionProps {
  widgets: WidgetType[];
}

export default function AnalyticsSection({ widgets }: AnalyticsSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
      </div>
      <hr className="mb-6 border-gray-200" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets.map((widget) => (
          <DashboardWidget key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
}
