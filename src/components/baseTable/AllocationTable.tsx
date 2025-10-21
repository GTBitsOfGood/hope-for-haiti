"use client";


import React, {
  ForwardedRef,
  ReactNode,
  forwardRef,
  useCallback,
  useRef,
} from "react";
import { CgChevronDown, CgChevronRight, CgSpinner } from "react-icons/cg";

import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "./AdvancedBaseTable";
import LineItemChipGroup, {
  PartnerDistributionSummary,
} from "../LineItemChipGroup";
import { TableQuery } from "@/types/ui/table.types";

export interface AllocationTableItem {
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
    priority: string | null;
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
    suggestedAllocation?: {
      previousPartner: {
        id: number;
        name: string;
      } | null;
      nextPartner: {
        id: number;
        name: string;
      } | null;
    };
  }[];
}

export type AllocationTableHandle = AdvancedBaseTableHandle<AllocationTableItem>;

export interface AllocationTableProps {
  fetchData: (
    pageSize: number,
    page: number,
    filters: FilterList<AllocationTableItem>
  ) => Promise<TableQuery<AllocationTableItem>>;
  toolBar?: ReactNode;
  pageSize?: number;
  updateItemById?: AllocationTableHandle["updateItemById"];
  ensureDistributionForPartner?: (
    partnerId: number,
    partnerName: string
  ) => Promise<PartnerDistributionSummary>;
  onDistributionRemoved?: (partnerId: number) => void;
  isInteractionMode?: boolean;
  emptyState?: ReactNode;
  onDataLoaded?: (items: AllocationTableItem[]) => void;
}

const columns: ColumnDefinition<AllocationTableItem>[] = [
  {
    id: "title",
    header: "Title",
    cell: (item, _index, isOpen) => (
      <span className="flex gap-2 items-center -ml-2">
        {isOpen ? <CgChevronDown /> : <CgChevronRight />}
        <p>{item.title || "N/A"}</p>
      </span>
    ),
  },
  "type",
  "quantity",
  {
    id: "expirationDate",
    header: "Expiration",
    cell: (item) =>
      item.expirationDate
        ? new Date(item.expirationDate).toLocaleDateString()
        : "N/A",
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

const defaultEmptyState = (
  <div className="flex justify-center items-center mt-8">
    <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
  </div>
);

function enrichItem(item: AllocationTableItem): AllocationTableItem {
  return {
    ...item,
    requests: item.requests.map((request) => ({
      ...request,
      itemsAllocated: item.items
        .filter((line) => line.allocation?.partner?.id === request.partnerId)
        .reduce((sum, line) => sum + line.quantity, 0),
    })),
  };
}

const AllocationTable = forwardRef(function AllocationTableInner(
  {
    fetchData,
    toolBar,
    pageSize = 20,
    updateItemById,
    ensureDistributionForPartner,
    onDistributionRemoved,
    isInteractionMode = false,
    emptyState = defaultEmptyState,
    onDataLoaded,
  }: AllocationTableProps,
  ref: ForwardedRef<AllocationTableHandle>
) {
  const tableRef = useRef<AllocationTableHandle | null>(null);

  const setTableRef = useCallback(
    (instance: AllocationTableHandle | null) => {
      tableRef.current = instance;
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        (ref as React.MutableRefObject<AllocationTableHandle | null>).current =
          instance;
      }
    },
    [ref]
  );

  const resolveUpdateItem = useCallback(
    (
      id: number,
      updater: Parameters<AllocationTableHandle["updateItemById"]>[1]
    ) => {
      if (updateItemById) {
        updateItemById(id, updater);
        return;
      }
      tableRef.current?.updateItemById(id, updater);
    },
    [updateItemById]
  );

  const updateItemsAllocated = useCallback(
    (itemId: number, partnerId: number) => {
      resolveUpdateItem(itemId, (prev) => ({
        ...prev,
        requests: prev.requests.map((request) =>
          request.partnerId === partnerId
            ? {
                ...request,
                itemsAllocated: prev.items
                  .filter(
                    (line) => line.allocation?.partner?.id === partnerId
                  )
                  .reduce((sum, line) => sum + line.quantity, 0),
              }
            : request
        ),
      }));
    },
    [resolveUpdateItem]
  );

  const wrappedFetch = useCallback<
    AllocationTableProps["fetchData"]
  >(
    async (pageSizeArg, pageArg, filtersArg) => {
      const result = await fetchData(pageSizeArg, pageArg, filtersArg);
      const data = result.data.map(enrichItem);
      onDataLoaded?.(data);
      return {
        data,
        total: result.total,
      };
    },
    [fetchData, onDataLoaded]
  );

  return (
    <AdvancedBaseTable
      ref={setTableRef}
      columns={columns}
      fetchFn={wrappedFetch}
      rowId="id"
      pageSize={pageSize}
      toolBar={toolBar}
      emptyState={emptyState}
      rowBody={(item) => (
        <LineItemChipGroup
          items={item.items}
          requests={item.requests}
          generalItemId={item.id}
          updateItem={resolveUpdateItem}
          updateItemsAllocated={(partnerId) =>
            updateItemsAllocated(item.id, partnerId)
          }
          ensureDistributionForPartner={ensureDistributionForPartner}
          onDistributionRemoved={onDistributionRemoved}
          isInteractionMode={isInteractionMode}
        />
      )}
    />
  );
});

export default AllocationTable;
