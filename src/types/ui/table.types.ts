import React from "react";

export type FilterValue =
  | { type: "string"; value: string }
  | { type: "number"; gte?: number; lte?: number }
  | { type: "date"; gte?: string; lte?: string }
  | { type: "enum"; values: string[] };

export type FilterList<T> = Partial<Record<keyof T, FilterValue>>;

export type TableQuery<T> = {
  data: T[];
  total: number;
};

export type RowIdAccessor<T> = keyof T | ((item: T) => string | number);

export interface ColumnConfig<T> {
  id: keyof T | string;
  header?: React.ReactNode;
  cell?: (item: T, index: number, isOpen: boolean) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  filterType?: FilterValue["type"];
  filterOptions?: string[];
  filterable?: boolean;
}

export type ColumnDefinition<T> = keyof T | ColumnConfig<T>;

export interface ResolvedColumn<T> {
  id: string;
  accessor?: keyof T;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (item: T, index: number, isOpen: boolean) => React.ReactNode;
  filterType?: FilterValue["type"];
  filterOptions?: string[];
  filterable?: boolean;
}

export interface FilterableColumnMeta<T> {
  accessor: keyof T;
  label: string;
  type: FilterValue["type"];
  options?: string[];
}

export interface AdvancedBaseTableHandle<T> {
  reload: () => void;
  setItems: (value: T[] | ((items: T[]) => T[])) => void;
  upsertItem: (item: T) => void;
  removeItemById: (id: string | number) => void;
  updateItemById: (
    id: string | number,
    updater: Partial<T> | ((current: T) => Partial<T> | T | undefined)
  ) => void;
}
