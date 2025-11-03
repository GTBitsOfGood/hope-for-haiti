"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartConfiguration,
  type Chart,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GaugeWidgetProps {
  current: number;
  goal: number;
  label: string;
  textColor?: string;
}

export default function GaugeWidget({
  current,
  goal,
  label,
  textColor,
}: GaugeWidgetProps) {
  const computeStep = (g: number): number => {
    if (g <= 0) return 1;
    const power = Math.max(Math.floor(Math.log10(g)) - 1, 0);
    return 5 * Math.pow(10, power);
  };

  const step = computeStep(goal);
  const maxBound = current <= goal ? goal : Math.ceil(current / step) * step;

  const progress = Math.min(current, maxBound);
  const remaining = Math.max(maxBound - progress, 0);

  const formatUpperBound = (v: number): string => {
    return v % 1_000_000 === 0
      ? String(v / 1_000_000)
      : v.toLocaleString("en-US");
  };

  const chartData = {
    labels: ["Progress", "Remaining"],
    datasets: [
      {
        data: [progress, remaining],
        backgroundColor: ["#2774AE", "#e5e7eb"],
        borderWidth: 0,
        cutout: "60%",
      },
    ],
  };

  const options: ChartConfiguration<"doughnut">["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  const goalIndicator = {
    id: "goalIndicator",
    afterDatasetsDraw(chart: Chart<"doughnut">) {
      if (!isOver) return; // draw indicator only when goal is exceeded
      const meta = chart.getDatasetMeta(0);
      const arc = meta?.data?.[0] as unknown as
        | {
            x: number;
            y: number;
            outerRadius: number;
            innerRadius: number;
            startAngle: number;
            endAngle: number;
          }
        | undefined;
      if (!arc) return;
      const ctx = chart.ctx;
      const { x, y, outerRadius, innerRadius, startAngle, endAngle } = arc;

      const t = Math.min(goal / maxBound, 1);
      const angle = startAngle + t * (endAngle - startAngle);
      const rOuter = outerRadius;
      const rInner = innerRadius;

      const x1 = x + rInner * Math.cos(angle);
      const y1 = y + rInner * Math.sin(angle);
      const x2 = x + rOuter * Math.cos(angle);
      const y2 = y + rOuter * Math.sin(angle);

      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const labelRadius = outerRadius + 20;
      const lx = x + labelRadius * Math.cos(angle);
      const ly = y + labelRadius * Math.sin(angle);
      ctx.fillStyle = "#000000";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Goal", lx, ly);
      ctx.restore();
    },
  };

  const displayValue = current.toLocaleString("en-US");

  const overPct = Math.round(((current - goal) / goal) * 100);
  const fromPct = Math.round(((goal - current) / goal) * 100);
  const isOver = current > goal;

  return (
    <>
      <div className="relative h-60 flex items-center justify-center">
        <div className="w-full h-60">
          <Doughnut
            data={chartData}
            options={options}
            plugins={[goalIndicator]}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mt-20">
          <p
            className="text-2xl font-medium mt-20"
            style={{ color: textColor || "#2774AE" }}
          >
            Total:
          </p>
          <p
            className="text-3xl font-bold"
            style={{ color: textColor || "#2774AE" }}
          >
            {displayValue}
          </p>
        </div>
      </div>

      <div className="flex justify-between text-lg font-medium text-gray-600 mt-1 mx-20">
        <span>0</span>
        <span>{formatUpperBound(maxBound)}</span>
      </div>
      <div className="text-center mt-2">
        <p className="text-md text-gray-600">
          Goal: {label}{" "}
          <span style={{ color: textColor || "#2774AE" }}>
            {isOver
              ? `(+${overPct}% above goal)`
              : `(${fromPct}% from the goal)`}
          </span>
        </p>
      </div>
    </>
  );
}
