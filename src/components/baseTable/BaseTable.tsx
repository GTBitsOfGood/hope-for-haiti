import { formatTableValue } from "@/util/format";
import React, { useState } from "react";
import { CgChevronLeft, CgChevronRight } from "react-icons/cg";

interface TableRow {
  cells: React.ReactNode[];
  onClick?: () => void;
  className?: string;
}

interface BaseTableProps {
  headers: React.ReactNode[];
  rows: TableRow[];
  headerClassName?: string;
  headerCellStyles?: string;
  rowCellStyles?: string;
  pageSize?: number;
}

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

export default function BaseTable({
  headers,
  rows,
  headerClassName = "bg-blue-light text-gray-primary/70 border-b-2 border-blue-primary/10",
  pageSize = 20,
  headerCellStyles,
  rowCellStyles,
}: BaseTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const paginationStart = (currentPage - 1) * pageSize;
  const paginationEnd = Math.min(paginationStart + pageSize, rows.length);
  const decrementPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const incrementPage = () => {
    if (paginationEnd < rows.length) {
      setCurrentPage(currentPage + 1);
    }
  };
  return (
    <div>
      <div>
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
                className={`bg-white data-[odd=false]:bg-blue-light/35 border-b border-blue-primary/10 text-gray-primary ${row.onClick ? "cursor-pointer" : ""} ${row.className || ""}`}
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
          Page {currentPage} of {Math.ceil(rows.length / pageSize)}
        </span>
        <CgChevronRight
          onClick={incrementPage}
          className="inline-block w-6 h-6 ml-2 cursor-pointer"
        />
      </div>
    </div>
  );
}
