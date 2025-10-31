"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartWidgetProps {
  data: { label: string; value: number }[];
  orientation: "horizontal" | "vertical";
  axisTitleX?: string;
  axisTitleY?: string;
}

export default function BarChartWidget({
  data,
  orientation,
  axisTitleX,
  axisTitleY,
}: BarChartWidgetProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Value",
        data: data.map((d) => d.value),
        backgroundColor: "rgba(39, 116, 174, 0.2)",
        borderColor: "#57A0E5",
        borderWidth: 0.653,
      },
    ],
  };

  const options = {
    indexAxis: orientation === "horizontal" ? ("y" as const) : ("x" as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            if (orientation === "horizontal") {
              const value = context.parsed.x ?? context.parsed.y ?? 0;
              return `${value}M`;
            } else {
              const v = context.parsed.y ?? context.parsed.x ?? 0;
              const inMillions = v / 1_000_000;
              return `$${inMillions.toFixed(2)}M`;
            }
          },
        },
      },
    },
    scales:
      orientation === "horizontal"
        ? {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function (value: string | number) {
                  return `${value}`;
                },
              },
              title: {
                display: Boolean(axisTitleX),
                text: axisTitleX || "",
              },
            },
            y: {
              beginAtZero: true,
              title: {
                display: Boolean(axisTitleY),
                text: axisTitleY || "",
              },
            },
          }
        : {
            x: {
              beginAtZero: true,
              title: {
                display: Boolean(axisTitleX),
                text: axisTitleX || "",
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value: string | number) {
                  const inMillions = Number(value) / 1_000_000;
                  return `$${inMillions.toFixed(1)}M`;
                },
              },
              title: {
                display: Boolean(axisTitleY),
                text: axisTitleY || "",
              },
            },
          },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
