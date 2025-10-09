import React from "react";
import { formatTableValue } from "@/utils/format";
import {
  ColumnConfig,
  ColumnDefinition,
  FilterList,
  FilterValue,
  ResolvedColumn,
} from "@/types/ui/table.types";

export function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function isAccessorColumn<T>(
  column: ColumnDefinition<T>
): column is keyof T {
  return typeof column !== "object";
}

export function resolveHeader<T>(
  column: ColumnDefinition<T>,
  fallbackId: string
) {
  if (isAccessorColumn(column)) {
    return humanizeKey(String(column));
  }
  const config = column as ColumnConfig<T>;
  if (config.header) {
    return config.header;
  }
  return humanizeKey(String(config.id ?? fallbackId));
}

export function normalizeColumns<T>(
  columns: ColumnDefinition<T>[]
): ResolvedColumn<T>[] {
  return columns.map((column, index) => {
    if (isAccessorColumn(column)) {
      const accessor = column;
      const keyName = String(accessor);
      return {
        id: keyName,
        accessor,
        header: resolveHeader(column, keyName),
        render: (item: T) =>
          (item as Record<string, unknown>)[
            accessor as string
          ] as React.ReactNode,
      };
    }

    const config = column as ColumnConfig<T>;
    const id = String(config.id ?? index);
    const header = resolveHeader(config, id);

    const render: (item: T, index: number) => React.ReactNode = config.cell
      ? config.cell
      : typeof config.id === "string"
        ? (item: T) =>
            (item as Record<string, unknown>)[
              config.id as string
            ] as React.ReactNode
        : () => undefined;

    return {
      id,
      accessor:
        typeof config.id === "string" ? (config.id as keyof T) : undefined,
      header,
      headerClassName: config.headerClassName,
      cellClassName: config.cellClassName,
      render,
      filterType: config.filterType,
      filterOptions: config.filterOptions,
    };
  });
}

export function isDateLikeString(value: string) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return value.includes("-") || value.includes("/") || value.includes(":");
}

export function inferFilterTypeFromSample(
  values: unknown[]
): FilterValue["type"] | undefined {
  const filtered = values.filter(
    (value) => value !== null && value !== undefined
  );
  if (!filtered.length) {
    return undefined;
  }

  const sample = filtered[0];

  if (typeof sample === "number" || typeof sample === "bigint") {
    return "number";
  }

  if (sample instanceof Date) {
    return "date";
  }

  if (typeof sample === "boolean") {
    return "enum";
  }

  if (typeof sample === "string") {
    if (isDateLikeString(sample)) {
      return "date";
    }
    const uniqueValues = new Set(filtered as string[]);
    if (uniqueValues.size > 0 && uniqueValues.size <= 10) {
      return "enum";
    }
    return "string";
  }

  if (typeof sample === "object" && sample !== null) {
    const hasToNumber =
      "toNumber" in (sample as Record<string, unknown>) &&
      typeof (sample as Record<string, unknown>).toNumber === "function";
    if (hasToNumber) {
      return "number";
    }
    const stringified = String(sample);
    if (stringified !== "[object Object]") {
      const uniqueValues = new Set(filtered.map((value) => String(value)));
      return uniqueValues.size <= 10 ? "enum" : "string";
    }
  }

  return undefined;
}

/**
 * a takes precedence over b
 */
export function mergeFilters(
  a: FilterList<unknown> | undefined,
  b: FilterList<unknown> | undefined
): FilterList<unknown> {
  return { ...(b ?? {}), ...(a ?? {}) };
}

export function collectEnumOptions(values: unknown[]) {
  const options = new Set<string>();
  values.forEach((value) => {
    if (value === null || value === undefined) {
      return;
    }
    options.add(String(value));
  });
  return Array.from(options);
}

export function getDisplayContent(rawContent: unknown): React.ReactNode {
  if (React.isValidElement(rawContent)) {
    return rawContent;
  }
  if (rawContent === null || rawContent === undefined) {
    return "";
  }
  if (typeof rawContent === "string") {
    return formatTableValue(rawContent);
  }
  if (typeof rawContent === "number" || typeof rawContent === "bigint") {
    return formatTableValue(String(rawContent));
  }
  if (typeof rawContent === "boolean") {
    return rawContent ? "Yes" : "No";
  }
  if (rawContent instanceof Date) {
    return formatTableValue(rawContent.toISOString());
  }
  if (Array.isArray(rawContent)) {
    return rawContent as React.ReactNode;
  }
  if (
    typeof rawContent === "object" &&
    rawContent !== null &&
    "toString" in rawContent
  ) {
    const stringified = (rawContent as { toString: () => string }).toString();
    if (stringified !== "[object Object]") {
      return formatTableValue(stringified);
    }
  }
  return String(rawContent);
}
