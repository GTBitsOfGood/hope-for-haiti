import * as React from "react";
import type { TooltipRenderProps } from "react-joyride";

const cx = (...classes: Array<string | null | undefined | false>) =>
  classes.filter(Boolean).join(" ");

interface JoyrideStepProps extends TooltipRenderProps {
  onSkip?: () => void;
}

export default function JoyrideStep({
  backProps,
  index,
  onSkip,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: JoyrideStepProps) {
  const totalSteps = size ?? 0;
  const showPointer = step.placement !== "center";

  const arrowPositionClasses: Partial<Record<NonNullable<typeof step.placement>, string>> = {
    left: "absolute right-[-10px] top-1/2 -translate-y-1/2",
    right: "absolute left-[-10px] top-1/2 -translate-y-1/2",
    top: "absolute bottom-[-10px] left-1/2 -translate-x-1/2",
    bottom: "absolute top-[-10px] left-1/2 -translate-x-1/2",
  };

  const arrowClass = step.placement
    ? arrowPositionClasses[step.placement]
    : undefined;

  return (
    <div
      {...tooltipProps}
      data-tutorial-tooltip="true"
      style={{
        width: "min(24rem, calc(100vw - 1rem), calc(100dvw - 1rem))",
        maxWidth: "calc(100vw - 1rem)",
      }}
      className={cx("relative mx-2 overflow-visible")}
    >
      {showPointer && arrowClass && (
        <div
          className={cx(
            "pointer-events-none absolute z-0 h-5 w-5 rotate-45 bg-white shadow-xl",
            arrowClass
          )}
        />
      )}

      <div
        className={cx(
          "relative z-10 flex flex-col gap-3 rounded-2xl bg-white px-4 pt-4 pb-4 shadow-xl sm:px-8 sm:pt-6",
          "max-h-[min(82vh,calc(100dvh-1rem))] overflow-y-auto overscroll-contain"
        )}
      >
        {/* Title */}
        {step.title && (
          <h3 className="mr-4 text-lg font-bold sm:mr-7 sm:text-2xl">
            {step.title}
          </h3>
        )}

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
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Skip link */}
          <button
            type="button"
            {...skipProps}
            onClick={(event) => {
              skipProps.onClick?.(event);
              onSkip?.();
            }}
            className={cx(
              "w-fit text-sm font-medium text-red-primary",
              "focus:outline-none"
            )}
          >
            {skipProps.title}
          </button>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            {/* Back button (only after first step) */}
            {index > 0 && (
              <button
                type="button"
                {...backProps}
                className={cx(
                  "min-w-[72px] rounded border border-red-primary px-3 py-1.5 text-sm font-medium text-red-primary sm:min-w-[84px] sm:px-4"
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
                "min-w-[72px] rounded bg-red-primary px-4 py-1.5 text-sm font-medium text-white sm:min-w-[84px] sm:px-5"
              }
            >
              {primaryProps.title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
