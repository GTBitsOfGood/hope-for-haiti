import { Plus } from "@phosphor-icons/react";
import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { CgChevronLeft, CgChevronRight, CgSpinner } from "react-icons/cg";
import TableFilterMenu from "./TableFilterMenu";

import {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
  FilterableColumnMeta,
  RowIdAccessor,
  TableQuery,
} from "@/types/ui/table.types";
export type {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterValue,
  FilterList,
  FilterableColumnMeta,
  RowIdAccessor,
  TableQuery,
} from "@/types/ui/table.types";
import {
  collectEnumOptions,
  getDisplayContent,
  humanizeKey,
  inferFilterTypeFromSample,
  mergeFilters,
  normalizeColumns,
} from "./TableUtils";

interface AdvancedBaseTableProps<T extends object> {
  columns: ColumnDefinition<T>[];
  fetchFn: (
    pageSize: number,
    page: number,
    filters: FilterList<T>
  ) => Promise<TableQuery<T>>;
  rowId: RowIdAccessor<T>;
  pageSize?: number;
  headerClassName?: string;
  headerCellStyles?: string;
  rowCellStyles?: string;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, index: number) => string | undefined;
  emptyState?: React.ReactNode;
  toolBar?: React.ReactNode;
  additionalFilters?: FilterList<T>;
}

function AdvancedBaseTableInner<T extends object>(
  {
    columns,
    fetchFn,
    rowId,
    pageSize = 20,
    headerClassName = "bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10",
    headerCellStyles,
    rowCellStyles,
    onRowClick,
    rowClassName,
    emptyState,
    toolBar,
    additionalFilters,
  }: AdvancedBaseTableProps<T>,
  ref: ForwardedRef<AdvancedBaseTableHandle<T>>
) {
  const normalizedColumns = useMemo(() => normalizeColumns(columns), [columns]);
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterList<T>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [filterableColumns, setFilterableColumns] = useState<
    FilterableColumnMeta<T>[]
  >([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = React.useRef<HTMLDivElement | null>(null);

  const resolveRowId = useMemo(() => {
    if (typeof rowId === "function") {
      return rowId;
    }
    return (item: T) =>
      (item as Record<string, unknown>)[rowId as string] as string | number;
  }, [rowId]);

  useEffect(() => {
    setFilterableColumns((previous) => {
      const previousMap = new Map(
        previous.map((meta) => [meta.accessor, meta])
      );

      const next: FilterableColumnMeta<T>[] = [];

      normalizedColumns.forEach((column) => {
        if (!column.accessor) {
          return;
        }

        const key = column.accessor;
        const values = items.map(
          (item) => (item as Record<string, unknown>)[key as string]
        );

        const inferredType = inferFilterTypeFromSample(values);
        const previousMeta = previousMap.get(key);

        const type = column.filterType ?? previousMeta?.type ?? inferredType;
        if (!type) {
          return;
        }

        const headerLabel =
          typeof column.header === "string"
            ? column.header
            : humanizeKey(String(key));

        let options: string[] | undefined;
        if (type === "enum") {
          const providedOptions = column.filterOptions ?? [];
          const collectedOptions = collectEnumOptions([
            ...providedOptions,
            ...(previousMeta?.options ?? []),
            ...values,
          ]);
          options =
            collectedOptions.length > 0 ? collectedOptions : providedOptions;
        }

        next.push({
          accessor: key,
          label: headerLabel,
          type,
          options,
        });
      });

      return next;
    });
  }, [items, normalizedColumns]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFn(
        pageSize,
        page,
        mergeFilters(additionalFilters, filters)
      );
      setItems(response.data);
      setTotal(response.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load table data";
      setItems([]);
      setTotal(0);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, filters, page, pageSize, additionalFilters]);

  useEffect(() => {
    loadData();
  }, [loadData, reloadToken]);

  const triggerReload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setPage((current) => Math.max(current - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    setPage((current) => Math.min(current + 1, totalPages));
  }, [pageSize, total]);

  const applyFilters = useCallback((nextFilters: FilterList<T>) => {
    setFilters(nextFilters);
    setPage(1);
    setIsFilterMenuOpen(false);
  }, []);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setIsFilterMenuOpen(false);
      }
    };

    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterMenuOpen]);

  const reload = useCallback(() => {
    triggerReload();
  }, [triggerReload]);

  const setItemsExternally = useCallback(
    (value: T[] | ((items: T[]) => T[])) => {
      setItems((prev) => {
        if (typeof value === "function") {
          return (value as (items: T[]) => T[])(prev);
        }
        return value;
      });
    },
    []
  );

  const upsertItem = useCallback(
    (item: T) => {
      setItems((prev) => {
        const id = resolveRowId(item);
        const index = prev.findIndex((current) => resolveRowId(current) === id);
        if (index === -1) {
          setTotal((prevTotal) => prevTotal + 1);
          if (prev.length >= pageSize) {
            triggerReload();
            return prev;
          }
          return [...prev, item];
        }
        const next = [...prev];
        next[index] = item;
        return next;
      });
    },
    [pageSize, resolveRowId, triggerReload]
  );

  const removeItemById = useCallback(
    (id: string | number) => {
      setItems((prev) => {
        const next = prev.filter((row) => resolveRowId(row) !== id);
        if (next.length !== prev.length) {
          setTotal((prevTotal) => Math.max(prevTotal - 1, 0));
          if (next.length === 0 && page > 1) {
            setPage((current) => Math.max(current - 1, 1));
            triggerReload();
          }
        }
        return next;
      });
    },
    [page, resolveRowId, triggerReload]
  );

  const updateItemById = useCallback(
    (
      id: string | number,
      updater: Partial<T> | ((current: T) => Partial<T> | T | undefined)
    ) => {
      setItems((prev) => {
        const index = prev.findIndex((row) => resolveRowId(row) === id);
        if (index === -1) {
          return prev;
        }
        const next = [...prev];
        const currentItem = next[index];

        const resolvedUpdate =
          typeof updater === "function" ? updater(currentItem) : updater;

        if (resolvedUpdate === undefined) {
          return prev;
        }

        const mergedValue = {
          ...currentItem,
          ...(resolvedUpdate as Partial<T>),
        } as T;

        next[index] = mergedValue;
        return next;
      });
    },
    [resolveRowId]
  );

  useImperativeHandle(
    ref,
    () => ({
      reload,
      setItems: setItemsExternally,
      upsertItem,
      removeItemById,
      updateItemById,
    }),
    [reload, removeItemById, setItemsExternally, upsertItem, updateItemById]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const showEmptyState = !isLoading && !items.length && !error;

  return (
    <div>
      <div className="my-2 space-x-4 flex justify-end">
        {toolBar}
        {filterableColumns.length > 0 && (
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2 font-medium text-red-500 transition hover:bg-red-50"
            >
              <Plus size={18} /> Filter
            </button>
            {isFilterMenuOpen && (
              <TableFilterMenu
                columns={filterableColumns}
                filters={filters}
                onFiltersChange={applyFilters}
                onClose={() => setIsFilterMenuOpen(false)}
              />
            )}
          </div>
        )}
      </div>
      <div className="overflow-visible">
        <table className="mt-4 min-w-full">
          <thead>
            <tr
              className={`text-left font-bold ${
                headerClassName ? headerClassName : ""
              }`}
            >
              {normalizedColumns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-4 first:rounded-tl-lg last:rounded-tr-lg ${
                    headerCellStyles ? headerCellStyles : ""
                  } ${column.headerClassName ? column.headerClassName : ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={normalizedColumns.length} className="py-10">
                  <div className="flex justify-center">
                    <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={normalizedColumns.length}
                  className="py-6 text-center text-sm text-red-600"
                >
                  {error}
                </td>
              </tr>
            ) : showEmptyState ? (
              <tr>
                <td
                  colSpan={normalizedColumns.length}
                  className="py-6 text-center text-gray-primary/70"
                >
                  {emptyState ?? "No results found."}
                </td>
              </tr>
            ) : (
              items.map((item, rowIndex) => (
                <tr
                  key={String(resolveRowId(item))}
                  data-odd={rowIndex % 2 !== 0}
                  className={`bg-white data-[odd=false]:bg-sunken border-b border-gray-primary/10 text-gray-primary ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${rowClassName ? (rowClassName(item, rowIndex) ?? "") : ""}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {normalizedColumns.map((column) => {
                    const rawContent = column.render(item, rowIndex);
                    return (
                      <td
                        key={column.id}
                        className={`px-4 py-4 ${
                          rowCellStyles ? rowCellStyles : ""
                        } ${column.cellClassName ? column.cellClassName : ""}`}
                      >
                        {getDisplayContent(rawContent)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-end items-center text-gray-primary">
        <CgChevronLeft
          onClick={canGoPrevious ? goToPreviousPage : undefined}
          className={`inline-block w-6 h-6 mr-2 ${
            canGoPrevious ? "cursor-pointer" : "opacity-30"
          }`}
        />
        <span>
          Page {Math.min(page, totalPages)} of {totalPages}
        </span>
        <CgChevronRight
          onClick={canGoNext ? goToNextPage : undefined}
          className={`inline-block w-6 h-6 ml-2 ${
            canGoNext ? "cursor-pointer" : "opacity-30"
          }`}
        />
      </div>
    </div>
  );
}

const AdvancedBaseTable = forwardRef(AdvancedBaseTableInner) as <
  T extends object,
>(
  props: AdvancedBaseTableProps<T> & {
    ref?: React.ForwardedRef<AdvancedBaseTableHandle<T>>;
  }
) => ReturnType<typeof AdvancedBaseTableInner>;

export default AdvancedBaseTable;

export function extendTableHeader(header: string, className: string) {
  return (
    <th
      className={`${className} px-4 py-4 first:rounded-tl-lg last:rounded-tr-lg`}
      key={header}
    >
      {header}
    </th>
  );
}

export function tableConditional(
  cond: boolean,
  trueVal: React.ReactNode[],
  falseVal: React.ReactNode[] = []
) {
  return cond ? trueVal : falseVal;
}

export function renderHeaders(
  headers: React.ReactNode[],
  headerCellStyles?: string
) {
  return headers.flat().map((header) =>
    typeof header === "string" ? (
      <th
        key={header}
        className={`px-4 py-4 first:rounded-tl-lg last:rounded-tr-lg ${
          headerCellStyles || ""
        }`}
      >
        {header}
      </th>
    ) : (
      header
    )
  );
}
