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
import { useApiClient } from "@/hooks/useApiClient";
import LineItemChip from "@/components/LineItemChip";

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
      id: number;
      name: string;
    };
    createdAt: string;
    quantity: number;
    priority: $Enums.RequestPriority | null;
    comments: string;
    itemsAllocated: number;
  }[];
  items: {
    id: number;
    quantity: number;
    datePosted: string | null;
    donorName: string | null;
    lotNumber: string | null;
    palletNumber: string | null;
    boxNumber: string | null;
    allocation: {
      id: number;
      partner: {
        id: number;
        name: string;
      } | null;
    } | null;
  }[];
}

export default function AdminUnallocatedItemsScreen() {
  const [selectedItems, setSelectedItems] = useState<
    UnallocatedItemData["id"][]
  >([]);

  const tableRef = useRef<AdvancedBaseTableHandle<UnallocatedItemData>>(null);

  const { apiClient } = useApiClient();

  function calculateItemsAllocated(
    item: UnallocatedItemData,
    request: UnallocatedItemData["requests"][number]
  ) {
    return item.items
      .filter((it) => it.allocation?.partner?.id === request.partnerId)
      .reduce((sum, it) => sum + it.quantity, 0);
  }

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

      const items = res.items.map((item) => ({
        ...item,
        requests: item.requests.map((request) => ({
          ...request,
          itemsAllocated: calculateItemsAllocated(item, request),
        })),
      }));

      return {
        data: items,
        total: items.length,
      };
    },
    [apiClient]
  );

  function updateItemsAllocated(itemId: number, partnerId: number) {
    tableRef.current?.updateItemById(itemId, (prev) => ({
      ...prev,
      requests: prev.requests.map((request) =>
        request.partnerId === partnerId
          ? {
              ...request,
              itemsAllocated: calculateItemsAllocated(prev, request),
            }
          : request
      ),
    }));
  }

  const columns: ColumnDefinition<UnallocatedItemData>[] = [
    {
      id: "title",
      header: "Title",
      cell: (item) => (
        <span className="flex gap-2 items-center -ml-2">
          {selectedItems.includes(item.id) ? (
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
          setSelectedItems((prev) =>
            prev.includes(item.id)
              ? prev.filter((id) => id !== item.id)
              : [...prev, item.id]
          );
        }}
        rowBody={(item) =>
          selectedItems.includes(item.id) ? (
            <ChipGroup
              items={item.items}
              requests={item.requests}
              generalItemId={item.id}
              updateItem={tableRef.current!.updateItemById}
              updateItemsAllocated={updateItemsAllocated}
            />
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

function ChipGroup({
  items,
  requests,
  generalItemId,
  updateItem,
  updateItemsAllocated,
}: {
  items: UnallocatedItemData["items"];
  requests: UnallocatedItemData["requests"];
  generalItemId: number;
  updateItem: AdvancedBaseTableHandle<UnallocatedItemData>["updateItemById"];
  updateItemsAllocated: (itemId: number, partnerId: number) => void;
}) {
  return (
    <div className="w-full bg-gray-100 flex flex-wrap p-2">
      {items.length === 0 && (
        <p className="w-full text-center text-gray-500">
          No line items available.
        </p>
      )}
      {items.map((item) => (
        <LineItemChip
          key={item.id}
          item={item}
          requests={requests}
          generalItemId={generalItemId}
          updateItem={updateItem}
          updateItemsAllocated={(partnerId) =>
            updateItemsAllocated(generalItemId, partnerId)
          }
        />
      ))}
    </div>
  );
}
