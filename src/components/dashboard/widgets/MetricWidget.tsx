interface MetricWidgetProps {
  value: string;
}

export default function MetricWidget({ value }: MetricWidgetProps) {
  return <p className="text-3xl font-bold text-blue-primary">{value}</p>;
}
