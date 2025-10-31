import MetricWidget from "./MetricWidget";
import MetricGroupWidget from "./MetricGroupWidget";
import LeaderboardWidget from "./LeaderboardWidget";
import BarChartWidget from "./BarChartWidget";
import GaugeWidget from "./GaugeWidget";
import PieChartWidget from "./PieChartWidget";
import type { DashboardWidget as WidgetType } from "../analyticsData";

interface DashboardWidgetProps {
  widget: WidgetType;
}

export default function DashboardWidget({ widget }: DashboardWidgetProps) {
  const commonWrapperClass =
    "rounded-[5.227px] border border-blue-primary/[0.80] bg-white px-[26px] py-5";

  const renderContent = () => {
    switch (widget.type) {
      case "metric":
        return <MetricWidget value={widget.value} />;
      case "metricGroup":
        return <MetricGroupWidget metrics={widget.metrics} />;
      case "leaderboard":
        return <LeaderboardWidget items={widget.items} />;
      case "bar":
        return (
          <BarChartWidget
            data={widget.data}
            orientation={widget.orientation}
            axisTitleX={widget.axisTitleX}
            axisTitleY={widget.axisTitleY}
          />
        );
      case "gauge":
        return (
          <GaugeWidget
            current={widget.current}
            goal={widget.goal}
            label={widget.label}
            textColor={widget.textColor}
          />
        );
      case "pie":
        return <PieChartWidget data={widget.data} />;
      default:
        return null;
    }
  };

  const hasTitle = widget.type !== "metricGroup";

  return (
    <div className={`${commonWrapperClass} h-full flex flex-col`}>
      {hasTitle && (
        <h3 className="text-md font-medium text-black mb-4">{widget.title}</h3>
      )}
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
