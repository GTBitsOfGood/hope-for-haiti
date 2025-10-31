"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartWidgetProps {
  data: { name: string; value: number }[];
}

export default function PieChartWidget({ data }: PieChartWidgetProps) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: [
          "rgba(39, 116, 174, 0.8)", // blue-primary
          "rgba(39, 116, 174, 0.6)", // lighter blue
          "rgba(39, 116, 174, 0.4)", // even lighter blue
        ],
        borderColor: [
          "rgba(39, 116, 174, 1)",
          "rgba(39, 116, 174, 0.8)",
          "rgba(39, 116, 174, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}
