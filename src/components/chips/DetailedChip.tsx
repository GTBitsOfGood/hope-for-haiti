import { ReactNode } from "react";

export default function DetailedChip({
  title,
  subtitle,
  amount,
  showLabel,
  label,
  className,
  icon,
  selected,
  onClick,
  disabled,
  labelColor,
}: {
  title: string;
  subtitle?: string;
  amount?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  icon?: ReactNode;
  selected: boolean;
  onClick?: () => void;
  disabled?: boolean;
  labelColor?: "red" | "yellow";
}) {
  const isDisabled = disabled || !onClick;
  const labelBgColor =
    labelColor === "yellow"
      ? "bg-amber-100 text-amber-800"
      : label
        ? "bg-red-primary/20 text-red-primary"
        : "bg-gray-primary/10 text-gray-primary/30";

  return (
    <div className="relative">
      <button
        className={`relative rounded-lg border m-2 px-2 py-1 text-sm gap-1 flex flex-col justify-start
          transition-colors duration-100
          ${
            isDisabled
              ? "border-gray-300 bg-gray-100 opacity-60 cursor-default"
              : "border-blue-primary hover:shadow"
          }
          ${selected && !isDisabled ? "bg-blue-primary/10" : ""} ${className}`}
        onClick={onClick}
        disabled={isDisabled}
      >
        <div
          className={`font-bold ${isDisabled ? "text-gray-500" : "text-blue-primary"}`}
        >
          {title}
        </div>
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-center gap-1">
            {icon}
            {subtitle && (
              <span
                className={isDisabled ? "text-gray-500" : "text-blue-primary"}
              >
                {subtitle}
              </span>
            )}
          </div>
          {amount && (
            <span className="bg-white rounded overflow-clip">
              <span
                className={`block h-full px-1 font-bold ${
                  isDisabled
                    ? "text-gray-500 bg-gray-200"
                    : "text-red-primary bg-red-primary/20"
                }`}
              >
                {amount}
              </span>
            </span>
          )}
        </div>
        {(showLabel || label) && (
          <span className="absolute -left-2 -top-2 rounded overflow-clip text-xs shadow-sm bg-white">
            <span
              className={`block max-w-[110px] h-full truncate px-1 py-[1px] ${labelBgColor}`}
            >
              {label ?? "None"}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
