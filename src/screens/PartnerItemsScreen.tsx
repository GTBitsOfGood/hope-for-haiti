"use client";

import React, { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { RequestPriority } from "@prisma/client";

import RequestPopover from "@/components/DonorOffers/RequestPopover";
import {
  AvailableItemDTO,
  AvailableItemsResponse,
} from "@/types/api/generalItem.types";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import { Step } from "react-joyride";
import Tutorial from "@/components/Tutorial";
import { useSearchParams } from "next/navigation";
import Chip from "@/components/chips/Chip";

interface ActionButtonProps {
  item: AvailableItemDTO;
  onOpenPopover: (item: AvailableItemDTO) => void;
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
  onRequestSave: (data: {
    quantity: number;
    priority: RequestPriority;
    comments: string;
  }) => void;
  selectedItem: AvailableItemDTO | null;
}

function ActionButton({
  item,
  onOpenPopover,
  isPopoverOpen,
  onPopoverClose,
  onRequestSave,
  selectedItem,
}: ActionButtonProps) {
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
          wishlistMatch={item.wishlistMatch}
        />
      )}
    </div>
  );
}

const tutorialSteps: Step[] = [
  {
    target: "body",
    title: 
    <div>
    Welcome to your <span className="text-red-primary">Items!</span>
    </div>,
    content:
    <div>
      Your <span className="text-red-primary">items</span> page is where you will be able to browse all items available in inventory and make requests depending on your needs.
      <p><strong>New here? Take a quick tour of this page.</strong></p>
    </div>,
    placement: "center",
    isFixed: true,
  },
  {
    target: '[data-tutorial="filter-button"]',
    title: "Filter",
    content: "Click here to filter your items.",
    placement: "left",
  },
  {
    target: '[data-tutorial="filter-expanded"]',
    title: "Filter",
    content: 
    <div>
      <p>Items cam be filtered by:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>Name</li>
        <li>Pallet Number</li>
        <li>Donor Name</li>
        <li>Date Range</li>
      </ul>
    </div>,
    placement: "left",
    spotlightPadding: 0,
  },
  {
    target: '[data-tutorial="individual-item"]',
    title: "Items",
    content:
      <div>
        <strong>This is an individual item.</strong>
        <p>Here you can see an item&apos;s:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Actions</li>
          <li>Title & Description</li>
          <li>Expiration Date</li>
          <li>Available Quantity</li>
          <li>Unit Type</li>
          <li>Donor</li>
        </ul>
      </div>,
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="request-button"]',
    title: "Requesting an Item",
    content:
      <div>
        <p>Let&apos;s practice requesting an item.</p>
        <strong>To start the request creation process, you would click the <span className="text-red-primary">Request Item</span> button.</strong>
      </div>,
      placement: "bottom",
  },
  {
    target: '[data-tutorial="advanced-table-row"]',
    title: "Items",
    content: "Each item has its details, quantity, expiration, and type",
  },
];

export default function PartnerItemsScreen() {
  const { apiClient } = useApiClient();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AvailableItemDTO | null>(
    null
  );

  const tableRef = useRef<AdvancedBaseTableHandle<AvailableItemDTO>>(null);
  const tutorialRowInsertedRef = useRef(false);
  const originalItemsRef = useRef<AvailableItemDTO[] | null>(null);

  const handleTutorialEnd = () => {
  if (tutorialRowInsertedRef.current) {
    tableRef.current?.setItems(originalItemsRef.current ?? []);
    tutorialRowInsertedRef.current = false;
    originalItemsRef.current = null;
  }

  tableRef.current?.setFilterMenuOpen(false);
};

  const handleTutorialStepChange = (stepIndex: number) => {
    tableRef.current?.setFilterMenuOpen(stepIndex === 2);

    if (stepIndex === 3) {
    const currentItems = tableRef.current?.getAllItems() ?? [];

    if (currentItems.length === 0) {
      originalItemsRef.current = currentItems;
      tutorialRowInsertedRef.current = true;

      const tutorialItem: AvailableItemDTO = {
        id: -999999,
        title: "Canned Vegetables",
        description: "Tutorial example item",
        expirationDate: new Date(),
        availableQuantity: 24,
        initialQuantity: 24,
        unitType: "Case",
        requestId: null,
        quantityRequested: null,
        priority: null,
        comments: null,
        wishlistMatch: null,
        donorOffer: {
          donorName: "Tutorial Donor",
          partnerResponseDeadline: new Date().toISOString(),
        },
      } as AvailableItemDTO;

      tableRef.current?.setItems([tutorialItem]);
    }
    return;
  }
};

  const searchParams = useSearchParams();

  const fetchAvailableItems = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AvailableItemDTO>
    ) => {
      try {
        const initialItems = searchParams.get("initialItems");

        const donorOfferId = searchParams.get("donorOfferId");

        const params = new URLSearchParams({
          pageSize: pageSize.toString(),
          page: page.toString(),
          filters: JSON.stringify(filters),
          ...(initialItems ? { initialItems } : {}),
          ...(donorOfferId ? { donorOfferId } : {}),
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
    [apiClient, searchParams]
  );

  const handleRequestSave = async (
    item: AvailableItemDTO,
    requestData: {
      quantity: number;
      priority: RequestPriority;
      comments: string;
      removeFromWishlist?: boolean;
      wishlistId?: number;
    }
  ) => {
    try {
      const formData = new FormData();
      formData.append("quantity", requestData.quantity.toString());
      formData.append("priority", requestData.priority);
      formData.append("comments", requestData.comments);

      if (item.requestId) {
        await apiClient.patch(
          `/api/generalItems/${item.id}/requests/${item.requestId}`,
          {
            body: formData,
          }
        );

        tableRef.current?.updateItemById(item.id, {
          requestId: item.requestId,
          quantityRequested: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
          wishlistMatch: null,
        });

        toast.success("Request updated successfully!");
      } else {
        const fulfilledWishlistId =
          requestData.removeFromWishlist && requestData.wishlistId
            ? requestData.wishlistId
            : null;

        if (fulfilledWishlistId) {
          formData.append("removeFromWishlist", "true");
          formData.append("wishlistId", fulfilledWishlistId.toString());
        }

        const response = await apiClient.post<{ requestId: number }>(
          `/api/generalItems/${item.id}/requests`,
          {
            body: formData,
          }
        );

        tableRef.current?.updateItemById(item.id, {
          requestId: response.requestId,
          quantityRequested: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
          wishlistMatch: null,
        });

        if (fulfilledWishlistId && tableRef.current) {
          const allItems = tableRef.current.getAllItems();
          allItems.forEach((tableItem) => {
            if (
              tableItem.wishlistMatch?.wishlistId === fulfilledWishlistId &&
              tableItem.id !== item.id
            ) {
              tableRef.current?.updateItemById(tableItem.id, {
                wishlistMatch: null,
              });
            }
          });
        }

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
          <div className="flex flex-col">
            <ActionButton
              item={item}
              onOpenPopover={handlePopoverOpen}
              isPopoverOpen={isPopoverOpen}
              onPopoverClose={handlePopoverClose}
              onRequestSave={(data) => handleRequestSave(item, data)}
              selectedItem={selectedItem}
            />
            <div className="text-xs mt-1 text-red-primary">
              Deadline:{" "}
              {item.donorOffer.partnerResponseDeadline
                ? new Date(
                    item.donorOffer.partnerResponseDeadline
                  ).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        );
      },
    },
    {
      id: "title",
      header: "Title and Description",
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
      cell: (item) =>
        item.expirationDate
          ? new Date(item.expirationDate).toLocaleDateString()
          : "N/A",
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
    {
      id: "donorName",
      header: "Donor",
      filterType: "string",
        cell: (item) => <Chip title={item.donorOffer.donorName} className={item.wishlistMatch ? "border-red-primary" : undefined} textColor={item.wishlistMatch ? "text-red-primary" : undefined} />,
      },
  ];

  const getRowClassName = (item: AvailableItemDTO) => {
    if (!item.wishlistMatch) return undefined;
    if (item.wishlistMatch.strength === "hard") {
      return "!bg-red-primary/25 !border-2 !border-red-primary/75";
    }
    return "!bg-red-primary/10 !border-2 !border-red-primary/50";
  };

  return (
    <div className="w-full px-4 py-6 font-[Open_Sans]">
      <Tutorial tutorialSteps={tutorialSteps} type="items" onStepChange={handleTutorialStepChange} onTutorialEnd={handleTutorialEnd}/>
      <h1 className="text-2xl font-semibold text-gray-primary mb-6">
        
        Available Items
      
      </h1>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchAvailableItems}
        rowId="id"
        pageSize={25}
        emptyState="No available items found."
        rowClassName={getRowClassName}
      />
    </div>
  );
}
