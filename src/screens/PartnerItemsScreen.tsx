"use client";

import React, { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { RequestPriority } from "@prisma/client";

import RequestPopover from "@/components/DonorOffers/RequestPopover";
import { AvailableItemDTO, AvailableItemsResponse } from "@/types/api/generalItem.types";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";

interface ActionButtonProps {
  item: AvailableItemDTO;
  onOpenPopover: (item: AvailableItemDTO) => void;
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
  onRequestSave: (data: { quantity: number; priority: RequestPriority; comments: string }) => void;
  selectedItem: AvailableItemDTO | null;
}

function ActionButton({ item, onOpenPopover, isPopoverOpen, onPopoverClose, onRequestSave, selectedItem }: ActionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasRequest = item.requestId != null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => onOpenPopover(item)}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          hasRequest
            ? "border-2 border-red-primary text-red-primary bg-white"
            : "bg-red-primary text-white"
        }`}
      >
        {hasRequest ? "Edit Request" : "Add Request"}
      </button>

      {selectedItem && selectedItem.id === item.id && (
        <RequestPopover
          isOpen={isPopoverOpen}
          onClose={onPopoverClose}
          onSave={onRequestSave}
          initialData={{
            quantity: item.quantityRequested || 0,
            priority: item.priority as RequestPriority | null,
            comments: item.comments ?? null,
          }}
          buttonRef={buttonRef}
          item={{
            requestId: item.requestId ?? null,
            donorOfferItemId: item.id,
          }}
        />
      )}
    </div>
  );
}

export default function PartnerItemsScreen() {
  const { apiClient } = useApiClient();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AvailableItemDTO | null>(null);

  const tableRef = useRef<AdvancedBaseTableHandle<AvailableItemDTO>>(null);

  const fetchAvailableItems = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AvailableItemDTO>
    ) => {
      try {
        const params = new URLSearchParams({
          pageSize: pageSize.toString(),
          page: page.toString(),
          filters: JSON.stringify(filters),
        });

        const data = await apiClient.get<AvailableItemsResponse>(
          `/api/generalItems?${params}`
        );

        return {
          data: data.items || [],
          total: data.total || 0,
        };
      } catch (error: unknown) {
        toast.error("Failed to fetch available items");
        console.error("Fetch error:", error);
        throw error;
      }
    },
    [apiClient]
  );

  const handleRequestSave = async (
    item: AvailableItemDTO,
    requestData: {
      quantity: number;
      priority: RequestPriority;
      comments: string;
    }
  ) => {
    try {
      const formData = new FormData();
      formData.append("quantity", requestData.quantity.toString());
      formData.append("priority", requestData.priority);
      formData.append("comments", requestData.comments);

      if (item.requestId) {
        // Update existing request
        await apiClient.patch(
          `/api/generalItems/${item.id}/requests/${item.requestId}`,
          {
            body: formData,
          }
        );

        // Update the item in the table
        tableRef.current?.updateItemById(item.id, {
          requestId: item.requestId,
          quantityRequested: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
        });

        toast.success("Request updated successfully!");
      } else {
        // Create new request
        const response = await apiClient.post<{ requestId: number }>(
          `/api/generalItems/${item.id}/requests`,
          {
            body: formData,
          }
        );

        // Update the item in the table with the new requestId
        tableRef.current?.updateItemById(item.id, {
          requestId: response.requestId,
          quantityRequested: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
        });

        toast.success("Request created successfully!");
      }

      setIsPopoverOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error saving request:", error);
      toast.error("Error saving request");
    }
  };

  const handlePopoverOpen = (item: AvailableItemDTO) => {
    setSelectedItem(item);
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setSelectedItem(null);
  };

  const columns: ColumnDefinition<AvailableItemDTO>[] = [
    {
      id: "actions",
      header: "Actions",
      cell: (item) => {
        return (
          <ActionButton
            item={item}
            onOpenPopover={handlePopoverOpen}
            isPopoverOpen={isPopoverOpen}
            onPopoverClose={handlePopoverClose}
            onRequestSave={(data) => handleRequestSave(item, data)}
            selectedItem={selectedItem}
          />
        );
      },
    },
    {
      id: "title",
      header: "Title",
      filterType: "string",
      cellClassName: "!whitespace-normal max-w-lg",
      cell: (item) => (
        <div className="break-words">
          <div className="font-medium">{item.title}</div>
          {item.description && (
            <div className="text-sm text-gray-500 mt-1">{item.description}</div>
          )}
        </div>
      ),
    },
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (item) => item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : "N/A",
    },
    {
      id: "availableQuantity",
      header: "Available Quantity",
      filterType: "number",
    },
    {
      id: "unitType",
      header: "Unit Type",
      filterType: "string",
    },
  ];

  return (
    <div className="w-full px-4 py-6 font-[Open_Sans]">
      <h1 className="text-2xl font-semibold text-gray-primary mb-6">Available Items</h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchAvailableItems}
        rowId="id"
        pageSize={25}
        emptyState="No available items found."
      />
    </div>
  );
}
