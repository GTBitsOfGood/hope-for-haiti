import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "./baseTable/AdvancedBaseTable";
import { useCallback, useRef } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import {
  CurrentRequestGroup,
  CurrentRequestsResponse,
} from "@/types/api/adminRequests.types";

export default function CurrentRequestsTable() {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<CurrentRequestGroup>>(null);

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<CurrentRequestGroup>
    ) => {
      const searchParams = new URLSearchParams({
        status: "current",
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });
      const res = await apiClient.get<CurrentRequestsResponse>(
        `/api/adminRequests?${searchParams.toString()}`
      );

      return {
        data: res.data,
        total: res.total,
      };
    },
    [apiClient]
  );

  const columns = [
    {
      id: "date",
      header: "Date Requested",
      filterType: "date",
      cell: (row) =>
        new Date(row.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      id: "partnerName",
      header: "Partner Name",
      filterType: "string",
      cell: (row) => row.partner.name,
    },
    {
      id: "itemCount",
      header: "Items Requested",
      filterable: false,
      cell: (row) => row.items.length,
    },
  ] as ColumnDefinition<CurrentRequestGroup>[];

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchTableData}
      rowId={(row) => `${new Date(row.date).getTime()}|${row.partner.id}`}
      emptyState="No current requests found."
      rowBody={(group) => (
        <div className="bg-blue-light/30 p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-primary/70">
                <th className="px-4 py-2 font-medium">Item Requested</th>
                <th className="px-4 py-2 font-medium">Quantity Requested</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <tr
                  key={item.requestId}
                  className="border-t border-blue-primary/10"
                >
                  <td className="px-4 py-2">{item.title}</td>
                  <td className="px-4 py-2">{item.quantityRequested}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
