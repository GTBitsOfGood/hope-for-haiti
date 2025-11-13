"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
} from "@/components/baseTable/AdvancedBaseTable";
import PartnerRequestChipGroup, {
  PartnerRequestChipData,
} from "@/components/chips/PartnerRequestChipGroup";
import { CgChevronDown, CgChevronUp } from "react-icons/cg";
import { DonorOfferHeader } from "@/components/DonorOffers/DonorOfferHeader";

// Types for general items with requests
type GeneralItemWithRequests = {
  id: number;
  title: string;
  type: string;
  expirationDate: string | Date | null;
  unitType: string;
  quantityPerUnit: number;
  initialQuantity: number;
  requestQuantity: number | null;
  description?: string;
  requests: {
    id: number;
    quantity: number;
    finalQuantity: number;
    partner: { id: number; name: string };
  }[];
};

// Types for general items with allocations (line items)
type GeneralItemWithAllocations = {
  id: number;
  title: string;
  type: string;
  expirationDate: string | Date | null;
  unitType: string;
  quantity: number;
  initialQuantity: number;
  description?: string;
  items: {
    id: number;
    quantity: number;
    lotNumber: string;
    palletNumber: string;
    boxNumber: string;
    allocation: {
      id: number;
      partner: { id: number; name: string };
    } | null;
  }[];
  requests: {
    id: number;
    quantity: number;
    finalQuantity: number;
    partner: { id: number; name: string };
  }[];
};

type TabType = "requests" | "allocations";

export default function AdminArchivedDonorOfferScreen() {
  const { donorOfferId } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  
  const requestsTableRef =
    useRef<AdvancedBaseTableHandle<GeneralItemWithRequests>>(null);
  const allocationsTableRef =
    useRef<AdvancedBaseTableHandle<GeneralItemWithAllocations>>(null);
  
  const { apiClient } = useApiClient();

  const fetchRequestsData = useCallback(
    async (pageSize: number, page: number) => {
      const data = await apiClient.get<{
        donorOffer: { state: string };
        items: GeneralItemWithRequests[];
      }>(`/api/donorOffers/${donorOfferId}?requests=true`, {
        cache: "no-store",
      });

      const items = data.items;
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);
      return { data: paged, total: items.length };
    },
    [apiClient, donorOfferId]
  );

  const fetchAllocationsData = useCallback(
    async (pageSize: number, page: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const data = await apiClient.get<{
        items: GeneralItemWithAllocations[];
        total: number;
      }>(`/api/donorOffers/${donorOfferId}/allocationItems?${params}`, {
        cache: "no-store",
      });

      return { data: data.items, total: data.total };
    },
    [apiClient, donorOfferId]
  );

  const requestsColumns: ColumnDefinition<GeneralItemWithRequests>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Item Name",
        cell: (i) => i.title,
        filterType: "string",
      },
      {
        id: "expirationDate",
        header: "Expiration",
        cell: (i) =>
          i.expirationDate
            ? new Date(i.expirationDate).toLocaleDateString()
            : "None",
        filterType: "date",
      },
      { id: "unitType", header: "Unit Type", cell: (i) => i.unitType },
      {
        id: "initialQuantity",
        header: "Quantity",
        cell: (i) => i.initialQuantity,
      },
      {
        id: "description",
        header: "Description",
        cell: (i) => i.description || "N/A",
      },
      {
        id: "requestSummary",
        header: "Request Summary",
        cell: (i, _, isOpen) => {
          const totalQty = i.requests.reduce(
            (s, r) =>
              s +
              (r.finalQuantity !== r.quantity ? r.finalQuantity : r.quantity),
            0
          );
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                {isOpen ? <CgChevronUp /> : <CgChevronDown />}
              </span>
              <button className="px-2 py-1 border-black border rounded text-sm">
                Total <span className="font-semibold">{totalQty}</span>
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const allocationsColumns: ColumnDefinition<GeneralItemWithAllocations>[] =
    useMemo(
      () => [
        {
          id: "title",
          header: "Item Name",
          cell: (i) => i.title,
          filterType: "string",
        },
        {
          id: "expirationDate",
          header: "Expiration",
          cell: (i) =>
            i.expirationDate
              ? new Date(i.expirationDate).toLocaleDateString()
              : "None",
          filterType: "date",
        },
        { id: "unitType", header: "Unit Type", cell: (i) => i.unitType },
        {
          id: "quantity",
          header: "Total Quantity",
          cell: (i) => i.quantity,
        },
        {
          id: "allocatedCount",
          header: "Allocated",
          cell: (i) => {
            const allocated = i.items.filter((item) => item.allocation).length;
            return `${allocated} / ${i.items.length}`;
          },
        },
        {
          id: "description",
          header: "Description",
          cell: (i) => i.description || "N/A",
        },
      ],
      []
    );

  const requestsRowBody = useCallback((item: GeneralItemWithRequests) => {
    const chipData: PartnerRequestChipData[] = item.requests.map((r) => ({
      id: r.id,
      partner: { name: r.partner.name },
      quantity: r.quantity,
      finalQuantity: r.finalQuantity,
    }));
    return (
      <PartnerRequestChipGroup
        requests={chipData}
        generalItemId={item.id}
        onRequestUpdated={() => {}}
        isLLMMode={false}
        readOnly={true}
      />
    );
  }, []);

  const allocationsRowBody = useCallback(
    (item: GeneralItemWithAllocations) => {
      return (
        <div className="p-4 bg-gray-50">
          <div className="text-sm font-semibold mb-2">Line Items:</div>
          <div className="space-y-2">
            {item.items.map((lineItem) => (
              <div
                key={lineItem.id}
                className="flex items-center justify-between p-2 bg-white rounded border"
              >
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600">
                    Lot: {lineItem.lotNumber}
                  </span>
                  <span className="text-gray-600">
                    Pallet: {lineItem.palletNumber}
                  </span>
                  <span className="text-gray-600">Box: {lineItem.boxNumber}</span>
                  <span className="text-gray-600">
                    Qty: {lineItem.quantity}
                  </span>
                </div>
                <div>
                  {lineItem.allocation ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {lineItem.allocation.partner.name}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      Unallocated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
    []
  );

  return (
    <div>
      <DonorOfferHeader donorOfferId={donorOfferId as string} />

      {/* Tabs */}
      <div className="border-b border-gray-300 mb-4">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "requests"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "allocations"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("allocations")}
          >
            Allocations
          </button>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Read-only:</strong> This donor offer is archived. No changes
          can be made.
        </p>
      </div>

      {/* Tables */}
      {activeTab === "requests" && (
        <AdvancedBaseTable
          ref={requestsTableRef}
          columns={requestsColumns}
          fetchFn={fetchRequestsData}
          rowId="id"
          rowBody={requestsRowBody}
          pageSize={20}
        />
      )}

      {activeTab === "allocations" && (
        <AdvancedBaseTable
          ref={allocationsTableRef}
          columns={allocationsColumns}
          fetchFn={fetchAllocationsData}
          rowId="id"
          rowBody={allocationsRowBody}
          pageSize={20}
        />
      )}
    </div>
  );
}

