import React, { useEffect, useRef, useState } from "react";
import { FilterList, FilterValue } from "@/types/ui/table.types";

interface FilterMenuColumn<T> {
  accessor: keyof T;
  label: string;
  type: FilterValue["type"];
  options?: string[];
}


interface TableFilterMenuProps<T extends object> {
  columns: FilterMenuColumn<T>[];
  filters: FilterList<T>;
  onFiltersChange: (filters: FilterList<T>) => void;
  onClose: () => void;
}

function buildRangeState<T extends object>(
  columns: FilterMenuColumn<T>[],
  filters: FilterList<T>
): Record<string, boolean> {
  const nextRange: Record<string, boolean> = {};

  columns.forEach((column) => {
    const keyString = String(column.accessor);

    if (column.type === "number") {
      const value = filters[column.accessor];
      if (value?.type === "number") {
        const { gte, lte } = value;
        const hasRange = gte !== undefined || lte !== undefined;
        const isSameValue = gte !== undefined && lte !== undefined && gte === lte;
        nextRange[keyString] = hasRange && !isSameValue;
      } else {
        nextRange[keyString] = false;
      }
      return;
    }

    if (column.type === "date") {
      const value = filters[column.accessor];
      if (value?.type === "date") {
        const { gte, lte } = value;
        const hasRange = Boolean(gte) || Boolean(lte);
        const isSameValue = Boolean(gte) && Boolean(lte) && gte === lte;
        nextRange[keyString] = hasRange && !isSameValue;
      } else {
        nextRange[keyString] = false;
      }
    }
  });

  return nextRange;
}

function buildEnumState<T extends object>(
  columns: FilterMenuColumn<T>[],
  filters: FilterList<T>
): Record<string, string[]> {
  const nextEnumSelections: Record<string, string[]> = {};

  columns.forEach((column) => {
    if (column.type === "enum") {
      const keyString = String(column.accessor);
      nextEnumSelections[keyString] = getEnumFilterValues(filters, column.accessor);
    }
  });

  return nextEnumSelections;
}

function rangeStateEqual(
  a: Record<string, boolean>,
  b: Record<string, boolean>
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

function enumStateEqual(
  a: Record<string, string[]>,
  b: Record<string, string[]>
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    const aValues = a[key] ?? [];
    const bValues = b[key] ?? [];
    if (aValues.length !== bValues.length) {
      return false;
    }

    for (let index = 0; index < aValues.length; index += 1) {
      if (aValues[index] !== bValues[index]) {
        return false;
      }
    }
  }

  return true;
}

function getStringFilterValue<T extends object>(
  filters: FilterList<T>,
  key: keyof T
) {
  const value = filters[key];
  return value?.type === "string" ? value.value : "";
}

function getNumberFilterValue<T extends object>(
  filters: FilterList<T>,
  key: keyof T,
  bound: "gte" | "lte"
) {
  const value = filters[key];
  if (value?.type !== "number") {
    return "";
  }
  const numeric = value[bound];
  return typeof numeric === "number" ? String(numeric) : "";
}

function getDateFilterValue<T extends object>(
  filters: FilterList<T>,
  key: keyof T,
  bound: "gte" | "lte"
) {
  const value = filters[key];
  if (value?.type !== "date") {
    return "";
  }
  const date = value[bound];
  return typeof date === "string" ? date : "";
}

function getEnumFilterValues<T extends object>(
  filters: FilterList<T>,
  key: keyof T
) {
  const value = filters[key];
  return value?.type === "enum" ? value.values : [];
}

export default function TableFilterMenu<T extends object>({
  columns,
  filters,
  onFiltersChange,
  onClose,
}: TableFilterMenuProps<T>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [rangeEnabled, setRangeEnabled] = useState<Record<string, boolean>>(() =>
    buildRangeState(columns, filters)
  );
  const [enumSelections, setEnumSelections] = useState<Record<string, string[]>>(() =>
    buildEnumState(columns, filters)
  );
  const rangeFromFiltersRef = useRef(rangeEnabled);
  const enumFromFiltersRef = useRef(enumSelections);

  useEffect(() => {
    const nextRange = buildRangeState(columns, filters);
    if (!rangeStateEqual(rangeFromFiltersRef.current, nextRange)) {
      rangeFromFiltersRef.current = nextRange;
      setRangeEnabled(nextRange);
    }

    const nextEnumSelections = buildEnumState(columns, filters);
    if (!enumStateEqual(enumFromFiltersRef.current, nextEnumSelections)) {
      enumFromFiltersRef.current = nextEnumSelections;
      setEnumSelections(nextEnumSelections);
    }
  }, [columns, filters]);

  const toggleRange = (keyString: string) => {
    setRangeEnabled((prev) => ({
      ...prev,
      [keyString]: !prev[keyString],
    }));
  };

  const addEnumValue = (keyString: string, value: string) => {
    setEnumSelections((prev) => {
      const current = prev[keyString] ?? [];
      if (current.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        [keyString]: [...current, value],
      };
    });
  };

  const removeEnumValue = (keyString: string, value: string) => {
    setEnumSelections((prev) => {
      const current = prev[keyString] ?? [];
      if (!current.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        [keyString]: current.filter((item) => item !== value),
      };
    });
  };

  const updateFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextFilters: FilterList<T> = {};

    columns.forEach((column) => {
      const key = column.accessor;
      const keyString = String(key);

      if (column.type === "string") {
        const value = formData.get(keyString);
        if (value) {
          nextFilters[key] = { type: "string", value: value.toString() };
        }
        return;
      }

      if (column.type === "number") {
        const isRange = rangeEnabled[keyString];
        if (isRange) {
          const gteRaw = formData.get(`${keyString}__gte`);
          const lteRaw = formData.get(`${keyString}__lte`);
          const gteParsed = gteRaw && gteRaw.toString().length > 0 ? Number(gteRaw) : undefined;
          const lteParsed = lteRaw && lteRaw.toString().length > 0 ? Number(lteRaw) : undefined;
          const gte = gteParsed !== undefined && !Number.isNaN(gteParsed) ? gteParsed : undefined;
          const lte = lteParsed !== undefined && !Number.isNaN(lteParsed) ? lteParsed : undefined;
          if (gte !== undefined || lte !== undefined) {
            nextFilters[key] = { type: "number", gte, lte };
          }
          return;
        }

        const exactValueRaw = formData.get(`${keyString}__value`);
        if (exactValueRaw && exactValueRaw.toString().length > 0) {
          const numeric = Number(exactValueRaw);
          if (!Number.isNaN(numeric)) {
            nextFilters[key] = { type: "number", gte: numeric, lte: numeric };
          }
        }
        return;
      }

      if (column.type === "date") {
        const isRange = rangeEnabled[keyString];
        if (isRange) {
          const gteRaw = formData.get(`${keyString}__gte`);
          const lteRaw = formData.get(`${keyString}__lte`);
          const gte = gteRaw && gteRaw.toString().length > 0 ? gteRaw.toString() : undefined;
          const lte = lteRaw && lteRaw.toString().length > 0 ? lteRaw.toString() : undefined;
          if (gte || lte) {
            nextFilters[key] = {
              type: "date",
              gte,
              lte,
            };
          }
          return;
        }

        const exactValue = formData.get(`${keyString}__value`);
        if (exactValue && exactValue.toString().length > 0) {
          const dateValue = exactValue.toString();
          nextFilters[key] = { type: "date", gte: dateValue, lte: dateValue };
        }
        return;
      }

      if (column.type === "enum") {
        const values = enumSelections[keyString] ?? [];
        if (values.length > 0) {
          nextFilters[key] = {
            type: "enum",
            values,
          };
        }
      }
    });

    onFiltersChange(nextFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
    formRef.current?.reset();
    const clearedRange: Record<string, boolean> = {};
    columns.forEach((column) => {
      if (column.type === "number" || column.type === "date") {
        clearedRange[String(column.accessor)] = false;
      }
    });
    setRangeEnabled(clearedRange);
    rangeFromFiltersRef.current = clearedRange;

    const clearedEnum: Record<string, string[]> = {};
    columns.forEach((column) => {
      if (column.type === "enum") {
        clearedEnum[String(column.accessor)] = [];
      }
    });
    setEnumSelections(clearedEnum);
    enumFromFiltersRef.current = clearedEnum;
  };

  return (
    <form
      ref={formRef}
      onSubmit={updateFilters}
      className="absolute -left-[320px] top-full z-40 mt-2 flex w-[min(26rem,calc(100vw-2rem))] max-h-[70vh] flex-col overflow-hidden rounded-xl border border-gray-primary/20 bg-white text-gray-primary shadow-xl focus:outline-none"
    >
      <div className="border-b border-gray-primary/10 bg-white px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filter</h2>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-primary/30 px-3 py-1.5 text-sm font-medium text-gray-primary transition hover:bg-gray-50"
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-primary/30 px-3 py-1.5 text-sm font-medium text-gray-primary transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg border border-red-500 px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-y-6">
          {columns.map((column) => {
            const key = column.accessor;
            const keyString = String(key);

            return (
              <div key={keyString} className="flex flex-col gap-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-primary/60">
                    {column.label}
                  </label>
                  {column.type === "string" && (
                    <span className="rounded-full border border-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                      Contains
                    </span>
                  )}
                  {(column.type === "number" || column.type === "date") && (
                    <label className="flex cursor-pointer items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                      <input
                        type="checkbox"
                        name={`${keyString}__range`}
                        checked={Boolean(rangeEnabled[keyString])}
                        onChange={() => toggleRange(keyString)}
                        className="h-3.5 w-3.5 accent-red-500"
                      />
                      Range
                    </label>
                  )}
                </div>

                {column.type === "string" && (
                  <input
                    key={`${keyString}-${getStringFilterValue(filters, key)}`}
                    type="text"
                    name={keyString}
                    defaultValue={getStringFilterValue(filters, key)}
                    placeholder="Enter value"
                    className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                  />
                )}

                {column.type === "number" && (
                  <>
                    {rangeEnabled[keyString] ? (
                      <div className="flex gap-2">
                        <input
                          key={`${keyString}-gte-${getNumberFilterValue(filters, key, "gte")}`}
                          type="number"
                          name={`${keyString}__gte`}
                          placeholder="Low"
                          defaultValue={getNumberFilterValue(filters, key, "gte")}
                          className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                        />
                        <input
                          key={`${keyString}-lte-${getNumberFilterValue(filters, key, "lte")}`}
                          type="number"
                          name={`${keyString}__lte`}
                          placeholder="High"
                          defaultValue={getNumberFilterValue(filters, key, "lte")}
                          className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <input
                        key={`${keyString}-value-${getNumberFilterValue(filters, key, "gte")}`}
                        type="number"
                        name={`${keyString}__value`}
                        placeholder="Enter value"
                        defaultValue={(() => {
                          const numberValue = filters[key];
                          if (numberValue?.type === "number") {
                            const { gte, lte } = numberValue;
                            if (
                              gte !== undefined &&
                              lte !== undefined &&
                              gte === lte
                            ) {
                              return String(gte);
                            }
                          }
                          return "";
                        })()}
                        className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                      />
                    )}
                  </>
                )}

                {column.type === "date" && (
                  <>
                    {rangeEnabled[keyString] ? (
                      <div className="flex gap-2">
                        <div className="flex w-full flex-col gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-primary/60">
                            Start
                          </span>
                          <input
                            key={`${keyString}-gte-${getDateFilterValue(filters, key, "gte")}`}
                            type="date"
                            name={`${keyString}__gte`}
                            defaultValue={getDateFilterValue(filters, key, "gte")}
                            className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                          />
                        </div>
                        <div className="flex w-full flex-col gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-primary/60">
                            End
                          </span>
                          <input
                            key={`${keyString}-lte-${getDateFilterValue(filters, key, "lte")}`}
                            type="date"
                            name={`${keyString}__lte`}
                            defaultValue={getDateFilterValue(filters, key, "lte")}
                            className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        key={`${keyString}-value-${getDateFilterValue(filters, key, "gte")}`}
                        type="date"
                        name={`${keyString}__value`}
                        defaultValue={(() => {
                          const dateValue = filters[key];
                          if (dateValue?.type === "date") {
                            const { gte, lte } = dateValue;
                            if (gte && lte && gte === lte) {
                              return gte;
                            }
                          }
                          return "";
                        })()}
                        className="w-full rounded-md border border-gray-primary/20 p-2 text-sm focus:border-gray-primary/40 focus:outline-none"
                      />
                    )}
                  </>
                )}

                {column.type === "enum" && (
                  <div className="flex flex-col gap-2">
                    {column.options && column.options.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2 rounded-md border border-red-500 bg-red-50/40 px-2 py-2">
                          {(enumSelections[keyString] ?? []).map((value) => (
                            <button
                              key={`${keyString}-selected-${value}`}
                              type="button"
                              onClick={() => removeEnumValue(keyString, value)}
                              className="flex items-center gap-1 rounded-full border border-red-500 bg-white px-3 py-1 text-xs font-medium text-red-500 shadow-sm transition hover:bg-red-50"
                            >
                              {value}
                              <span aria-hidden="true">×</span>
                            </button>
                          ))}
                          {(enumSelections[keyString] ?? []).length === 0 && (
                            <span className="text-xs text-gray-primary/60">
                              Select a value
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {column.options
                            .filter(
                              (option) =>
                                !(enumSelections[keyString] ?? []).includes(option)
                            )
                            .map((option) => (
                              <button
                                key={`${keyString}-option-${option}`}
                                type="button"
                                onClick={() => addEnumValue(keyString, option)}
                                className="rounded-full border border-red-500 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                              >
                                {option}
                              </button>
                            ))}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-primary/70">
                        No options available.
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}
