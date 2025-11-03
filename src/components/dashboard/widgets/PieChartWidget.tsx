"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartWidgetProps {
  data: { name: string; value: number }[];
}

export default function PieChartWidget({ data }: PieChartWidgetProps) {
  const backgroundColors = [
    "rgba(39, 116, 174, 0.8)",
    "rgba(39, 116, 174, 0.6)",
    "rgba(39, 116, 174, 0.4)",
    "rgba(39, 116, 174, 0.25)",
    "rgba(39, 116, 174, 0.15)",
  ];

  const borderColors = [
    "rgba(39, 116, 174, 1)",
    "rgba(39, 116, 174, 0.8)",
    "rgba(39, 116, 174, 0.6)",
    "rgba(39, 116, 174, 0.45)",
    "rgba(39, 116, 174, 0.3)",
  ];

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: backgroundColors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  } as const;

  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="h-64 sm:h-72 flex-1">
        <Pie data={chartData} options={options} />
      </div>

      <div className="min-w-[220px]">
        <div className="space-y-4">
          {data.map((d, idx) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-4 h-4 rounded"
                  style={{ backgroundColor: backgroundColors[idx] }}
                />
                <span className="text-black">{d.name}</span>
              </div>
              <span className="text-black font-semibold">
                {d.value.toLocaleString("en-US")}
              </span>
            </div>
          ))}
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-black font-medium">Total</span>
            <span className="text-black font-semibold">
              {total.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
