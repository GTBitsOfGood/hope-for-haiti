import { X } from "@phosphor-icons/react";
import React from "react";
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
        const gteRaw = formData.get(`${keyString}__gte`);
        const lteRaw = formData.get(`${keyString}__lte`);
        const gte = gteRaw ? Number(gteRaw) : undefined;
        const lte = lteRaw ? Number(lteRaw) : undefined;
        if (gteRaw || lteRaw) {
          nextFilters[key] = { type: "number", gte, lte };
        }
        return;
      }

      if (column.type === "date") {
        const gte = formData.get(`${keyString}__gte`);
        const lte = formData.get(`${keyString}__lte`);
        if (gte || lte) {
          nextFilters[key] = {
            type: "date",
            gte: gte ? gte.toString() : undefined,
            lte: lte ? lte.toString() : undefined,
          };
        }
        return;
      }

      if (column.type === "enum") {
        const rawValues = formData.getAll(`${keyString}__enum`);
        const values = rawValues
          .map((value) => value.toString())
          .filter((value) => value.length > 0);
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
  };

  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
      <div className="h-full w-full max-w-[420px] bg-white p-8 rounded-l-lg shadow-lg relative text-gray-primary overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Filter</h2>
          <X onClick={onClose} size={24} className="cursor-pointer" />
        </div>
        <form onSubmit={updateFilters} className="flex flex-col h-full">
          <div className="flex flex-col gap-y-6 mb-6">
            {columns.map((column) => {
              const key = column.accessor;
              const keyString = String(key);

              return (
                <div key={keyString} className="flex flex-col gap-y-2">
                  <label className="font-medium text-sm uppercase tracking-wide text-gray-primary/80">
                    {column.label}
                  </label>
                  {column.type === "string" && (
                    <input
                      type="text"
                      name={keyString}
                      defaultValue={getStringFilterValue(filters, key)}
                      className="border border-gray-primary/20 rounded-md p-2 w-full focus:outline-none focus:border-gray-primary/40"
                    />
                  )}
                  {column.type === "number" && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name={`${keyString}__gte`}
                        placeholder="Min"
                        defaultValue={getNumberFilterValue(filters, key, "gte")}
                        className="border border-gray-primary/20 rounded-md p-2 w-full focus:outline-none focus:border-gray-primary/40"
                      />
                      <input
                        type="number"
                        name={`${keyString}__lte`}
                        placeholder="Max"
                        defaultValue={getNumberFilterValue(filters, key, "lte")}
                        className="border border-gray-primary/20 rounded-md p-2 w-full focus:outline-none focus:border-gray-primary/40"
                      />
                    </div>
                  )}
                  {column.type === "date" && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name={`${keyString}__gte`}
                        defaultValue={getDateFilterValue(filters, key, "gte")}
                        className="border border-gray-primary/20 rounded-md p-2 w-full focus:outline-none focus:border-gray-primary/40"
                      />
                      <input
                        type="date"
                        name={`${keyString}__lte`}
                        defaultValue={getDateFilterValue(filters, key, "lte")}
                        className="border border-gray-primary/20 rounded-md p-2 w-full focus:outline-none focus:border-gray-primary/40"
                      />
                    </div>
                  )}
                  {column.type === "enum" && (
                    <div className="flex flex-col gap-2">
                      {column.options && column.options.length > 0 ? (
                        column.options.map((option) => {
                          const checkedValues = getEnumFilterValues(filters, key);
                          const isChecked = checkedValues.includes(option);
                          return (
                            <label
                              key={`${keyString}-${option}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                name={`${keyString}__enum`}
                                value={option}
                                defaultChecked={isChecked}
                                className="accent-red-500"
                              />
                              <span>{option}</span>
                            </label>
                          );
                        })
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
          <div className="mt-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                clearFilters();
                onClose();
              }}
              className="px-4 py-2 rounded-lg border border-gray-primary/30 text-gray-primary hover:bg-gray-50 transition"
            >
              Clear
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-primary/30 text-gray-primary hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition"
              >
                Apply filters
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
