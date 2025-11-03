import { ReactNode } from "react";

/**
 * Set showLabel to true to display the label even when it is empty.
 */
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
}) {
  return (
    <div className="relative">
      <button
        className={`relative rounded-lg border border-blue-primary m-2 px-2 py-1 text-sm gap-1 hover:shadow flex flex-col justify-start 
          transition-colors duration-100
          ${selected ? "bg-blue-primary/10" : ""} ${className}`}
        onClick={onClick}
        disabled={!onClick}
      >
        <div className="text-blue-primary font-bold">{title}</div>
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-center gap-1">
            {icon}
            {subtitle && <span className="text-blue-primary">{subtitle}</span>}
          </div>
          {amount && (
            <span className="bg-white rounded overflow-clip">
              <span className="block h-full px-1 font-bold text-red-primary bg-red-primary/20">
                {amount}
              </span>
            </span>
          )}
        </div>
        {(showLabel || label) && (
          <span className="absolute -left-2 -top-2 rounded overflow-clip text-xs shadow-sm bg-white">
            <span
              className={`block max-w-[110px] h-full truncate px-1 py-[1px] ${
                label
                  ? "bg-red-primary/20 text-red-primary"
                  : "bg-gray-primary/10 text-gray-primary/30"
              }`}
            >
              {label ?? "None"}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
