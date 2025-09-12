import { formatTableValue } from "@/utils/format";
import React from "react";

interface TableRow {
  cells: React.ReactNode[];
  onClick?: () => void;
}

interface BaseTableProps {
  headers: React.ReactNode[];
  rows: TableRow[];
  headerClassName?: string;
  pageSize: number;
}

export function extendTableHeader(header: string, className: string) {
  return (
    <th
      className={`${className} px-4 py-2 first:rounded-tl-lg last:rounded-tr-lg`}
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

export function renderHeaders(headers: React.ReactNode[]) {
  return headers.map((header) =>
    typeof header === "string" ? (
      <th
        key={header}
        className="px-4 py-2 first:rounded-tl-lg last:rounded-tr-lg"
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
  headerClassName,
  pageSize,
}: BaseTableProps) {
  console.log(pageSize); // Just to use pageSize and avoid lint errors for now
  return (
    <div>
      <table className="mt-4 min-w-full">
        <thead>
          <tr
            className={`text-left font-bold ${headerClassName ? headerClassName : ""} border-b-2`}
          >
            {renderHeaders(headers)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              data-odd={rowIndex % 2 !== 0}
              className={`bg-white data-[odd=true]:bg-gray-50 border-b ${row.onClick ? "cursor-pointer" : ""} data-[odd=true]:hover:bg-gray-100 hover:bg-gray-100 transition-colors`}
              onClick={row.onClick}
            >
              {row.cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2">
                  {typeof cell == "string" ? formatTableValue(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
