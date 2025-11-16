import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import Portal from "../baseTable/Portal";

/**
 * Set showLabel to true to display the label even when it is empty.
 * Popover is the dropdown content that appears when the chip is clicked.
 */
export default function Chip({
  title,
  amount,
  revisedAmount,
  showLabel,
  label,
  className,
  popover,
  setIsDropdownOpenRef,
}: {
  title: string;
  amount?: number;
  revisedAmount?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  popover?: ReactNode;
  setIsDropdownOpenRef?: RefObject<
    React.Dispatch<React.SetStateAction<boolean>>
  >;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (setIsDropdownOpenRef) setIsDropdownOpenRef.current = setIsDropdownOpen;
  }, [setIsDropdownOpen, setIsDropdownOpenRef]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={!popover}
        className={`relative rounded-lg border border-blue-primary m-2 px-2 py-1 text-sm flex items-center gap-1 hover:shadow ${className}`}
      >
        <span className="text-blue-primary">{title}</span>
        {amount !== undefined && revisedAmount !== amount && (
          <span className="line-through text-gray-primary/50 font-bold px-[2px]">
            {amount}
          </span>
        )}

        {(revisedAmount ?? amount) !== undefined && (
          <span
            className="rounded bg-blue-primary/20 font-bold px-[2px] text-blue-primary"
          >
            {revisedAmount ?? amount}
          </span>
        )}
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
      {popover && (
        <Portal
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          triggerRef={buttonRef}
          position="bottom-right"
          className="w-80 bg-white border border-gray-primary/20 rounded shadow-lg p-2"
        >
          {popover}
        </Portal>
      )}
    </div>
  );
}
