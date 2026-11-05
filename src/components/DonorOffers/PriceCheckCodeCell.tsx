"use client";

import { useEffect, useState } from "react";
import { validateCodeOverride } from "@/util/priceCheck";

interface PriceCheckCodeCellProps {
  row: number;
  title: string;
  initialCode: string | null;
  disabled: boolean;
  onCheck: (row: number, code: string) => Promise<string | null>;
}

export default function PriceCheckCodeCell({
  row,
  title,
  initialCode,
  disabled,
  onCheck,
}: PriceCheckCodeCellProps) {
  const [value, setValue] = useState(initialCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(initialCode ?? "");
    setError(null);
  }, [initialCode]);

  const check = async () => {
    const validation = validateCodeOverride(initialCode, value);
    if (validation.status === "error") {
      setError(validation.message);
      return;
    }

    setPending(true);
    setError(null);
    try {
      setError(await onCheck(row, validation.value));
    } finally {
      setPending(false);
    }
  };

  const inputId = `price-check-code-${row}`;
  const errorId = `${inputId}-error`;
  const isDisabled = disabled || pending;

  return (
    <div className="min-w-56">
      <div className="flex items-start gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          placeholder="NDC or UPC"
          aria-label={`Code for ${title}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={isDisabled}
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={check}
          disabled={isDisabled}
          className="shrink-0 rounded-md border border-red-500 bg-white px-3 py-1 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          {pending ? "Checking..." : "Check"}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" aria-live="assertive" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
