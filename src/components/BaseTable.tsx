import React from "react";

interface TableHeader {
  label: string;
  className?: string;
}

interface TableRow {
  cells: React.ReactNode[];
  onClick?: () => void;
}

interface BaseTableProps {
  headers: TableHeader[];
  rows: TableRow[];
  headerClassName?: string;
  pageSize: number;
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
            {headers.map((header, index) => (
              <th
                key={index}
                className={`px-4 py-2 ${header.className ? header.className : ""} ${
                  index === 0 ? "rounded-tl-lg" : ""
                } ${index === headers.length - 1 ? "rounded-tr-lg" : ""}`}
              >
                {header.label}
              </th>
            ))}
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
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
