"use client";

import React, { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { RequestPriority } from "@prisma/client";

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

// Action button component to handle refs properly
interface ActionButtonProps {
  item: DonorOfferItemsRequestsDTO;
  onOpenPopover: (
    item: DonorOfferItemsRequestsDTO,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => void;
}

function ActionButton({ item, onOpenPopover }: ActionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={() => onOpenPopover(item, buttonRef)}
      className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-600 transition-colors"
    >
      {item.requestId ? "Edit Request" : "Add Request"}
    </button>
  );
}

function getPriorityColor(
  value: string | RequestPriority | "" | null | undefined
): string {
  switch (value) {
    case "LOW":
      return "rgba(10,123,64,0.2)";
    case "MEDIUM":
      return "rgba(236,97,11,0.2)";
    case "HIGH":
      return "rgba(239,51,64,0.2)";
    default:
      return "rgba(249,249,249)";
  }
}

function titleCasePriority(value: string | RequestPriority): string {
  if (!value) return "";
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function PartnerDynamicDonorOfferScreen() {
  const { donorOfferId } = useParams();
  const router = useRouter();

  // States for the table and popover
  const [donorOfferName, setDonorOfferName] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DonorOfferItemsRequestsDTO | null>(null);
  const [popoverButtonRef, setPopoverButtonRef] = useState<React.RefObject<HTMLButtonElement | null> | null>(null);

  const tableRef = useRef<AdvancedBaseTableHandle<DonorOfferItemsRequestsDTO>>(null);
  const { apiClient } = useApiClient();

  // Fetch function for the table
  const fetchDonorOfferItems = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<DonorOfferItemsRequestsDTO>
    ) => {
      try {
        const data = await apiClient.get<DonorOfferItemsRequestsResponse>(
          `/api/donorOffers/${donorOfferId}`
        );
        setDonorOfferName(data.donorOfferName);
        return {
          data: data.donorOfferItemsRequests,
          total: data.total,
        };
      } catch (error: any) {
        if (error.message?.includes("404")) {
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
        // Update existing request
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
      } else {
        // Create new request 
        const formData = new FormData();
        formData.append("quantity", requestData.quantity.toString());
        formData.append("priority", requestData.priority);
        formData.append("comments", requestData.comments);

        await apiClient.post(
          `/api/generalItems/${item.donorOfferItemId}/requests`,
          {
            body: formData,
          }
        );
      }

      // Update the item in the table
      tableRef.current?.updateItemById(item.donorOfferItemId, {
        requestId: item.requestId || -1, // Will be updated by reload
        quantityRequested: requestData.quantity,
        priority: requestData.priority,
        comments: requestData.comments,
      });

      // Reload to get the correct requestId for new requests
      setTimeout(() => tableRef.current?.reload(), 100);

      toast.success(
        item.requestId ? "Request updated successfully!" : "Request created successfully!"
      );
    } catch (error) {
      console.error("Error saving request:", error);
      toast.error("Error saving request");
    }
  };

  const handlePopoverOpen = (
    item: DonorOfferItemsRequestsDTO,
    buttonRef: React.RefObject<HTMLButtonElement | null>
  ) => {
    setSelectedItem(item);
    setPopoverButtonRef(buttonRef);
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setSelectedItem(null);
    setPopoverButtonRef(null);
  };

  // Define columns for the AdvancedBaseTable
  const columns: ColumnDefinition<DonorOfferItemsRequestsDTO>[] = [
    {
      id: "title",
      header: "Title",
      filterType: "string",
    },
    {
      id: "type",
      header: "Type",
      filterType: "enum",
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
      cell: () => "Bottle", // Hardcoded for now
    },
    {
      id: "unitSize",
      header: "Qty/Unit",
      cell: (item) => item.unitSize.toString(),
    },
    {
      id: "quantityRequested",
      header: "Requested",
      cell: (item) => (item.quantityRequested || 0).toString(),
    },
    {
      id: "priority",
      header: "Priority",
      cell: (item) =>
        item.priority ? (
          <div
            className="inline-block px-2 py-1 rounded-md text-center"
            style={{
              backgroundColor: getPriorityColor(item.priority),
            }}
          >
            {titleCasePriority(item.priority)}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
      filterType: "enum",
      filterOptions: ["LOW", "MEDIUM", "HIGH"],
    },
    {
      id: "comments",
      header: "Comments",
      cell: (item) => (
        <span className="text-sm text-gray-600 truncate max-w-[100px] block">
          {item.comments || ""}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (item) => {
        return (
          <ActionButton
            item={item}
            onOpenPopover={handlePopoverOpen}
          />
        );
      },
    },
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

      <RequestPopover
        isOpen={isPopoverOpen}
        onClose={handlePopoverClose}
        onSave={(data) => {
          if (selectedItem) {
            handleRequestSave(selectedItem, data);
          }
        }}
        initialData={
          selectedItem
            ? {
                quantity: selectedItem.quantityRequested || 0,
                priority: selectedItem.priority as RequestPriority | null,
                comments: selectedItem.comments,
              }
            : undefined
        }
        buttonRef={popoverButtonRef || { current: null }}
      />
    </div>
  );
}
