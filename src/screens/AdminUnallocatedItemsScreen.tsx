"use client";

import { useState, useRef, useCallback } from "react";
import { CgChevronDown, CgChevronRight, CgSpinner } from "react-icons/cg";
import React from "react";
import { $Enums } from "@prisma/client";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import ItemRequestTable from "@/components/ItemRequestTable";
import { useApiClient } from "@/hooks/useApiClient";

export interface UnallocatedItemData {
  id: number;
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | null;
  unitType: string;
  quantityPerUnit: number;
  requests: {
    id: number;
    partnerId: number;
    partner: {
      name: string;
    };
    createdAt: string;
    quantity: number;
    priority: $Enums.RequestPriority | null;
    comments: string;
  }[];
  items: {
    id: number;
    quantity: number;
    datePosted: string | null;
    donorName: string | null;
    lotNumber: string | null;
    palletNumber: string | null;
    boxNumber: string | null;
  }[];
}

export default function AdminUnallocatedItemsScreen() {
  const [selectedItem, setSelectedItem] = useState<UnallocatedItemData>();

  const tableRef = useRef<AdvancedBaseTableHandle<UnallocatedItemData>>(null);

  const { apiClient } = useApiClient();

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<UnallocatedItemData>
    ) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });

      const res = await apiClient.get<{
        items: UnallocatedItemData[];
        total: number;
      }>(`/api/generalItems/unallocated?${params}`, {
        cache: "no-store",
      });

      return {
        data: res.items,
        total: res.items?.length ?? 0,
      };
    },
    []
  );

  const columns: ColumnDefinition<UnallocatedItemData>[] = [
    {
      id: "title",
      header: "Title",
      cell: (item) => (
        <span className="flex gap-2 items-center -ml-2">
          {selectedItem?.id === item.id ? (
            <CgChevronDown />
          ) : (
            <CgChevronRight />
          )}
          <p>{item.title || "N/A"}</p>
        </span>
      ),
    },
    "type",
    "quantity",
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (item) => {
        return item.expirationDate
          ? new Date(item.expirationDate).toLocaleDateString()
          : "N/A";
      },
    },
    "unitType",
    "quantityPerUnit",
    {
      id: "requests",
      header: "# of Requests",
      cell: (item) => item.requests?.length,
      filterable: false,
    },
    {
      id: "items",
      header: "# of Line Items",
      cell: (item) => item.items?.length,
      filterable: false,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Unallocated Items</h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchTableData}
        rowId="id"
        pageSize={20}
        onRowClick={(item) => {
          if (item.id === selectedItem?.id) {
            setSelectedItem(undefined);
          } else setSelectedItem(item);
        }}
        rowBody={(item) =>
          item === selectedItem ? (
            <ItemRequestTable generalItemData={selectedItem} />
          ) : undefined
        }
        emptyState={
          <div className="flex justify-center items-center mt-8">
            <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
          </div>
        }
      />
    </>
  );
}
