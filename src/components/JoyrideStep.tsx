import * as React from "react";
import type { TooltipRenderProps } from "react-joyride";

const cx = (...classes: Array<string | null | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export default function JoyrideStep({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  const totalSteps = size ?? 0;
  const showPointer = step.placement !== "center";

  return (
    <div
      {...tooltipProps}
      className={cx(
        "relative max-w-xl rounded-2xl bg-white px-8 pt-6 pb-4 shadow-xl",
        "flex flex-col gap-3"
      )}
    >
      {/* Right-side speech bubble arrow */}
      {showPointer && (
        <div className="pointer-events-none absolute right-[-10px] top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 bg-white shadow-xl" />
      )}

      {/* Title */}
      {step.title && <h3 className="mr-7 text-2xl font-bold">{step.title}</h3>}

      {/* Body content */}
      {step.content && (
        <div className="text-sm leading-relaxed text-gray-700">
          {step.content}
        </div>
      )}

      {/* Progress dots */}
      {totalSteps > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cx(
                "h-2 w-2 rounded-full bg-gray-primary/20",
                i === index && "bg-red-primary"
              )}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between">
        {/* Skip link */}
        <button
          type="button"
          {...skipProps}
          className={cx(
            "text-sm font-medium text-red-primary",
            "focus:outline-none"
          )}
        >
          {skipProps.title}
        </button>

        <div className="flex items-center gap-3">
          {/* Back button (only after first step) */}
          {index > 0 && (
            <button
              type="button"
              {...backProps}
              className={cx(
                "rounded border border-red-primary px-4 py-1.5 text-sm font-medium text-red-primary"
              )}
            >
              {backProps.title}
            </button>
          )}

          {/* Next / Done button */}
          <button
            type="button"
            {...primaryProps}
            className={
              "rounded bg-red-primary px-5 py-1.5 text-sm font-medium text-white"
            }
          >
            {primaryProps.title}
          </button>
        </div>
      </div>
    </div>
  );
}
