import { formatTableValue } from "@/utils/format";
import { Plus } from "@phosphor-icons/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CgChevronLeft, CgChevronRight, CgSpinner } from "react-icons/cg";
import TableFilterMenu from "./TableFilterMenu";

interface TableRow {
  cells: React.ReactNode[];
  onClick?: () => void;
  className?: string;
}

type TableQuery<T> = {
  data: T[];
  total: number;
};

export type FilterValue =
  | { type: "string"; value: string }
  | { type: "number"; gte: number; lte?: number }
  | { type: "date"; gte: string; lte?: string } // ISO strings
  | { type: "enum"; values: string[] };

interface BaseTableProps<T> {
  headers: React.ReactNode[];
  renderRow: (item: T, index: number) => TableRow;
  fetchFn: (
    pageSize: number,
    page: number,
    filters: Partial<Record<keyof T, FilterValue>>
  ) => Promise<TableQuery<T>>;
  headerClassName?: string;
  headerCellStyles?: string;
  rowCellStyles?: string;
  pageSize?: number;
  reloadKey?: number;
  filterLabels: string[];
  filterableCols?: (keyof T)[];
}

export type FilterList<T> = Partial<Record<keyof T, FilterValue>>;

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
        className={`px-4 py-4 first:rounded-tl-lg last:rounded-tr-lg ${headerCellStyles || ""}`}
      >
        {header}
      </th>
    ) : (
      header
    )
  );
}

export default function AdvancedBaseTable<T extends object>({
  headers,
  renderRow,
  fetchFn,
  headerClassName = "bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10",
  pageSize = 20,
  headerCellStyles,
  rowCellStyles,
  reloadKey = 0,
  filterLabels = [],
  filterableCols = [],
}: BaseTableProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  console.log(total);
  const [filters, setFilters] = useState<FilterList<T>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const fetch = useCallback(() => {
    console.log(filters);
    return fetchFn(pageSize, page, filters);
  }, [filters, page, pageSize, fetchFn]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const res = await fetch();
      setItems(res.data);
      setTotal(res.total);
      setIsLoading(false);
    };
    loadData();
  }, [fetch, reloadKey]);
  const rows = useMemo(
    () => items.map((item, index) => renderRow(item, index)),
    [items, renderRow]
  );
  const paginationStart = (page - 1) * pageSize;
  const paginationEnd = Math.min(paginationStart + pageSize, rows.length);
  const decrementPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  const incrementPage = () => {
    if (paginationEnd < rows.length) {
      setPage(page + 1);
    }
  };

  const openFilterMenu = () => {
    setIsFilterMenuOpen(true);
  };
  const closeFilterMenu = () => {
    setIsFilterMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-8">
        <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div>
      {isFilterMenuOpen && (
        <TableFilterMenu
          labels={filterLabels}
          data={items}
          close={closeFilterMenu}
          setFilters={setFilters}
          filters={filters}
          filterableCols={filterableCols}
        />
      )}
      <div className="flex justify-end my-2">
        {filterableCols.length > 0 && items.length > 0 && (
          <button
            onClick={openFilterMenu}
            className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition"
          >
            <Plus size={18} /> Filter
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="mt-4 min-w-full">
          <thead>
            <tr
              className={`text-left font-bold ${headerClassName ? headerClassName : ""}`}
            >
              {renderHeaders(headers, headerCellStyles)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(paginationStart, paginationEnd).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                data-odd={rowIndex % 2 !== 0}
                className={`bg-white data-[odd=false]:bg-sunken border-b border-gray-primary/10 text-gray-primary ${row.onClick ? "cursor-pointer" : ""} ${row.className || ""}`}
                onClick={row.onClick}
              >
                {row.cells.flat().map((cell, cellIndex) => (
                  <td key={cellIndex} className={`px-4 py-4 ${rowCellStyles}`}>
                    {typeof cell == "string" ? formatTableValue(cell) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-end items-center text-gray-primary">
        <CgChevronLeft
          onClick={decrementPage}
          className="inline-block w-6 h-6 mr-2 cursor-pointer"
        />
        <span>
          Page {page} of {Math.ceil(rows.length / pageSize)}
        </span>
        <CgChevronRight
          onClick={incrementPage}
          className="inline-block w-6 h-6 ml-2 cursor-pointer"
        />
      </div>
    </div>
  );
}
