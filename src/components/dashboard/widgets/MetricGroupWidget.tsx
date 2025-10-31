interface MetricGroupWidgetProps {
  metrics: { title: string; value: string }[];
}

export default function MetricGroupWidget({ metrics }: MetricGroupWidgetProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="p-4 pb-20 bg-gray-50 rounded-lg border border-blue-primary/[0.80]"
        >
          <p className="text-sm font-medium text-black mb-2">{metric.title}</p>
          <p className="text-2xl font-bold text-blue-primary">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}
