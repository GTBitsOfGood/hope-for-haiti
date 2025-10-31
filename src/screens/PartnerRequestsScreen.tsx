"use client";

import React, { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { RequestPriority } from "@prisma/client";

import RequestPopover from "@/components/DonorOffers/RequestPopover";
import { PartnerRequestDTO, PartnerRequestsResponse } from "@/types/api/generalItem.types";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";

interface ActionButtonProps {
  request: PartnerRequestDTO;
  onOpenPopover: (request: PartnerRequestDTO) => void;
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
  onRequestUpdate: (data: { quantity: number; priority: RequestPriority; comments: string }) => void;
  selectedRequest: PartnerRequestDTO | null;
}

function ActionButton({ request, onOpenPopover, isPopoverOpen, onPopoverClose, onRequestUpdate, selectedRequest }: ActionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => onOpenPopover(request)}
        className="px-3 py-1 rounded text-sm font-medium transition-colors border-2 border-red-primary text-red-primary bg-white"
      >
        Edit Request
      </button>

      {selectedRequest && selectedRequest.id === request.id && (
        <RequestPopover
          isOpen={isPopoverOpen}
          onClose={onPopoverClose}
          onSave={onRequestUpdate}
          initialData={{
            quantity: request.quantity,
            priority: request.priority as RequestPriority | null,
            comments: request.comments,
          }}
          buttonRef={buttonRef}
          item={{
            requestId: request.id,
            donorOfferItemId: request.generalItem.id,
          }}
        />
      )}
    </div>
  );
}

export default function PartnerRequestsScreen() {
  const { apiClient } = useApiClient();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequestDTO | null>(null);

  const tableRef = useRef<AdvancedBaseTableHandle<PartnerRequestDTO>>(null);

  const fetchRequests = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<PartnerRequestDTO>
    ) => {
      try {
        const params = new URLSearchParams({
          pageSize: pageSize.toString(),
          page: page.toString(),
          filters: JSON.stringify(filters),
        });

        const data = await apiClient.get<PartnerRequestsResponse>(
          `/api/requests?${params}`
        );

        return {
          data: data.requests || [],
          total: data.total || 0,
        };
      } catch (error: unknown) {
        toast.error("Failed to fetch requests");
        console.error("Fetch error:", error);
        throw error;
      }
    },
    [apiClient]
  );

  const handleRequestUpdate = async (
    request: PartnerRequestDTO,
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

      await apiClient.patch(
        `/api/generalItems/${request.generalItem.id}/requests/${request.id}`,
        {
          body: formData,
        }
      );

      tableRef.current?.updateItemById(request.id, {
        ...request,
        quantity: requestData.quantity,
        priority: requestData.priority,
        comments: requestData.comments,
      });

      toast.success("Request updated successfully!");
      setIsPopoverOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Error updating request");
    }
  };

  const handlePopoverOpen = (request: PartnerRequestDTO) => {
    setSelectedRequest(request);
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setSelectedRequest(null);
  };

  const columns: ColumnDefinition<PartnerRequestDTO>[] = [
    {
      id: "actions",
      header: "Actions",
      cell: (request) => {
        return (
          <ActionButton
            request={request}
            onOpenPopover={handlePopoverOpen}
            isPopoverOpen={isPopoverOpen}
            onPopoverClose={handlePopoverClose}
            onRequestUpdate={(data) => handleRequestUpdate(request, data)}
            selectedRequest={selectedRequest}
          />
        );
      },
    },
    {
      id: "generalItem",
      header: "Title and Description",
      filterType: "string",
      cellClassName: "!whitespace-normal max-w-lg",
      cell: (request) => (
        <div className="break-words">
          <div className="font-medium">{request.generalItem.title}</div>
          {request.generalItem.description && (
            <div className="text-sm text-gray-500 mt-1">{request.generalItem.description}</div>
          )}
        </div>
      ),
    },
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (request) => request.generalItem.expirationDate ? new Date(request.generalItem.expirationDate).toLocaleDateString() : "N/A",
      filterType: "date",
    },
    {
      id: "quantity",
      header: "Requested Quantity",
      filterType: "number",
    },
    {
      id: "finalQuantity",
      header: "Revised Quantity",
      filterType: "number",
    },
  ];

  return (
    <div className="w-full px-4 py-6 font-[Open_Sans]">
      <h1 className="text-2xl font-semibold text-gray-primary mb-6">My Requests</h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchRequests}
        rowId="id"
        pageSize={25}
        emptyState="No requests found."
      />
    </div>
  );
}
