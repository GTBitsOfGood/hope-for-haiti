"use client";

import React, { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { RequestPriority } from "@prisma/client";
import PriorityTag from "@/components/tags/PriorityTag";

import RequestPopover from "@/components/DonorOffers/RequestPopover";
import {
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "@/types/api/donorOffer.types";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import { Tooltip } from "react-tooltip";

interface ActionButtonProps {
  item: DonorOfferItemsRequestsDTO;
  onOpenPopover: (
    item: DonorOfferItemsRequestsDTO,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
  onRequestSave: (data: { quantity: number; priority: RequestPriority; comments: string }) => void;
  selectedItem: DonorOfferItemsRequestsDTO | null;
}

function ActionButton({ item, onOpenPopover, isPopoverOpen, onPopoverClose, onRequestSave, selectedItem }: ActionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => onOpenPopover(item, buttonRef)}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          item.requestId
            ? "border-2 border-red-primary text-red-primary bg-white"
            : "bg-red-primary text-white"
        }`}
      >
        {item.requestId ? "Edit Request" : "Add Request"}
      </button>
      
      {selectedItem && selectedItem.donorOfferItemId === item.donorOfferItemId && (
        <RequestPopover
          isOpen={isPopoverOpen}
          onClose={onPopoverClose}
          onSave={onRequestSave}
          initialData={{
            quantity: selectedItem.quantityRequested || 0,
            priority: selectedItem.priority as RequestPriority | null,
            comments: selectedItem.comments,
          }}
          buttonRef={buttonRef}
          item={{
            requestId: selectedItem.requestId,
            donorOfferItemId: selectedItem.donorOfferItemId,
          }}
        />
      )}
    </div>
  );
}


export default function PartnerDynamicDonorOfferScreen() {
  const { donorOfferId } = useParams();
  const router = useRouter();

  const [donorOfferName, setDonorOfferName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DonorOfferItemsRequestsDTO | null>(null);

  const tableRef = useRef<AdvancedBaseTableHandle<DonorOfferItemsRequestsDTO>>(null);
  const { apiClient } = useApiClient();

  const fetchDonorOfferItems = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<DonorOfferItemsRequestsDTO>
    ) => {
      try {
        const params = new URLSearchParams({
          pageSize: pageSize.toString(),
          page: page.toString(),
          filters: JSON.stringify(filters),
        });
        
        const data = await apiClient.get<DonorOfferItemsRequestsResponse>(
          `/api/donorOffers/${donorOfferId}?${params}`
        );
        setDonorOfferName(data.donorOfferName);
        return {
          data: data.donorOfferItemsRequests,
          total: data.total,
        };
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes("404")) {
          toast.error("Donor offer not found");
          router.push("/donorOffers");
        } else {
          toast.error("Failed to fetch donor offer data");
          console.error("Fetch error:", error);
        }
        throw error;
      }
    },
    [apiClient, donorOfferId, router]
  );

  const handleRequestSave = async (
    item: DonorOfferItemsRequestsDTO,
    requestData: {
      quantity: number;
      priority: RequestPriority;
      comments: string;
    }
  ) => {
    try {
      if (item.requestId) {
        const formData = new FormData();
        formData.append("quantity", requestData.quantity.toString());
        formData.append("priority", requestData.priority);
        formData.append("comments", requestData.comments);

        await apiClient.patch(
          `/api/generalItems/${item.donorOfferItemId}/requests/${item.requestId}`,
          {
            body: formData,
          }
        );

        tableRef.current?.updateItemById(item.donorOfferItemId, {
          requestId: item.requestId,
          quantityRequested: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
        });

        toast.success("Request updated successfully!");
      } else {
        const formData = new FormData();
        formData.append("quantity", requestData.quantity.toString());
        formData.append("priority", requestData.priority);
        formData.append("comments", requestData.comments);

        const response = await apiClient.post<{ requestId: number }>(
          `/api/generalItems/${item.donorOfferItemId}/requests`,
          {
            body: formData,
          }
        );

        tableRef.current?.updateItemById(item.donorOfferItemId, {
          requestId: response.requestId,
          quantityRequested: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
        });

        toast.success("Request created successfully!");
      }
    } catch (error) {
      console.error("Error saving request:", error);
      toast.error("Error saving request");
    }
  };

  const handlePopoverOpen = (
    item: DonorOfferItemsRequestsDTO,
  ) => {
    setSelectedItem(item);
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setSelectedItem(null);
  };

  const columns: ColumnDefinition<DonorOfferItemsRequestsDTO>[] = [
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
      id: "priority",
      header: "Priority",
      cell: (item) =>
        item.priority ? (
          <PriorityTag priority={item.priority} />
        ) : (
          <span className="text-gray-400">-</span>
        ),
      filterType: "enum",
      filterOptions: ["LOW", "MEDIUM", "HIGH"],
    },
    {
      id: "comments",
      header: "Comments",
      cell: (item) => {
        const content = item.comments || "";
        if (!content) {
          return <span className="text-sm text-gray-400">-</span>;
        }
        const tooltipId = `comments-tooltip-${item.donorOfferItemId}`;
        return (
          <>
            <span
              className="text-sm text-gray-600 truncate max-w-[100px] block cursor-default"
              data-tooltip-id={tooltipId}
              data-tooltip-content={content}
            >
              {content}
            </span>
            <Tooltip id={tooltipId} className="max-w-80 whitespace-pre-wrap" />
          </>
        );
      },
    },
    {
      id: "title",
      header: "Title",
      filterType: "string",
    },
    {
      id: "expiration",
      header: "Expiration",
      cell: (item) => item.expiration || "N/A",
    },
    {
      id: "initialQuantity",
      header: "Quantity",
      filterType: "number",
    },
    {
      id: "unitType",
      header: "Unit Type",
      cell: (item) => item.unitType,
    },
    {
      id: "quantityRequested",
      header: "Requested",
      cell: (item) => (item.quantityRequested || 0).toString(),
    }
  ];

  return (
    <div className="w-full px-4 py-6 font-[Open_Sans]">
      <nav className="text-sm mb-4">
        <Link href="/donorOffers" className="hover:underline">
          Donor Offers
        </Link>
        <span className="mx-3">/</span>
        <span className="bg-gray-100 px-2 py-1 rounded-sm">
          {donorOfferName}
        </span>
      </nav>
      <h1 className="text-2xl font-semibold mb-4">{donorOfferName}</h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchDonorOfferItems}
        rowId="donorOfferItemId"
        pageSize={25}
        emptyState="No items found in this donor offer."
      />
    </div>
  );
}
