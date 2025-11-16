"use client";

import React, { useEffect, useState } from "react";

interface ToggleViewSwitchProps {
  /** initial view, defaults to "partner" */
  defaultView?: "partner" | "allocation";
  /** controlled view (optional) */
  view?: "partner" | "allocation";
  onChange?: (view: "partner" | "allocation") => void;
  className?: string;
}

export default function ToggleViewSwitch({
  defaultView = "partner",
  view: controlledView,
  onChange,
  className = "",
}: ToggleViewSwitchProps) {
  const isControlled = controlledView !== undefined;
  const [internalView, setInternalView] = useState<"partner" | "allocation">(
    controlledView ?? defaultView
  );
  const activeView = isControlled
    ? (controlledView as "partner" | "allocation")
    : internalView;

  useEffect(() => {
    if (!isControlled) return;
    setInternalView(controlledView as "partner" | "allocation");
  }, [controlledView, isControlled]);

  function setView(next: "partner" | "allocation") {
    if (!isControlled) setInternalView(next);
    onChange?.(next);
  }

  return (
    <div
      className={`inline-flex items-center rounded-full bg-gray-primary/10 p-1 ${className}`}
      role="group"
      aria-label="Toggle view"
    >
      <button
        type="button"
        aria-pressed={activeView === "allocation"}
        className={`relative px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          activeView === "allocation"
            ? "bg-white shadow text-gray-primary/100"
            : "text-gray-primary/60"
        }`}
        onClick={() => setView("allocation")}
      >
        Allocation View
      </button>
      <button
        type="button"
        aria-pressed={activeView === "partner"}
        className={`relative ml-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          activeView === "partner"
            ? "bg-white shadow text-gray-primary/100"
            : "text-gray-primary/60"
        }`}
        onClick={() => setView("partner")}
      >
        Partner View
      </button>
    </div>
  );
}
