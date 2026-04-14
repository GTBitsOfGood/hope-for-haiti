"use client";

import React, { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { RequestPriority } from "@prisma/client";

import RequestPopover from "@/components/DonorOffers/RequestPopover";
import {
  PartnerRequestDTO,
  PartnerRequestsResponse,
} from "@/types/api/generalItem.types";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";
import { autoFillRequestExample } from "@/util/tutorialUtils";
import {
  TUTORIAL_REQUEST_DONOR_OFFER_ID,
  TUTORIAL_REQUEST_GENERAL_ITEM_ID,
  TUTORIAL_REQUEST_ROW_ID,
} from "@/util/tutorialIds";

interface ActionButtonProps {
  request: PartnerRequestDTO;
  onOpenPopover: (request: PartnerRequestDTO) => void;
  isPopoverOpen: boolean;
  onPopoverClose: () => void;
  onRequestUpdate: (data: {
    quantity: number;
    priority: RequestPriority;
    comments: string;
  }) => void;
  selectedRequest: PartnerRequestDTO | null;
  isTutorialTarget?: boolean;
}

function ActionButton({
  request,
  onOpenPopover,
  isPopoverOpen,
  onPopoverClose,
  onRequestUpdate,
  selectedRequest,
  isTutorialTarget = false,
}: ActionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        data-tutorial={isTutorialTarget ? "request-button" : undefined}
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

const fullscreenTutorialOverlayStyles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100dvw",
    height: "100dvh",
  },
  overlayLegacy: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100dvw",
    height: "100dvh",
  },
  overlayLegacyCenter: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100dvw",
    height: "100dvh",
  },
};

const tutorialSteps: TutorialStep[] = [
  {
    target: "body",
    title: (
      <div>
        Welcome to your <span className="text-red-primary">Requests!</span>
      </div>
    ),
    content: (
      <div>
        Your <span className="text-red-primary">Requests</span> page is where
        you will be able to view all of your requests. Here you can view, edit, and filter requests.
      </div>
    ),
    placement: "center",
    isFixed: true,
  },
  {
    target: '[data-tutorial="filter-button"]',
    title: "Filter",
    content: "Click here to filter your requests.",
    placement: "left",
    styles: fullscreenTutorialOverlayStyles,
    hideOnMobile: true,
  },
  {
    target: '[data-tutorial="filter-expanded"]',
    title: "Filter",
    content: (
      <div>
        <p>Requests can be filtered by:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Title and Description</li>
          <li>Expiration Date</li>
          <li>Requested Quantity</li>
          <li>Revised Quantity</li>
        </ul>
      </div>
    ),
    placement: "left",
    mobilePlacement: "center",
    spotlightPadding: 0,
    styles: fullscreenTutorialOverlayStyles,
    hideOnMobile: true,
  },
  {
    target: '[data-tutorial="individual-item"]',
    title: "Requests",
    content: (
      <div>
        <strong className="py-1">This is an individual request.</strong>
        <p>Here you can see a request&apos;s:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Action</li>
          <li>Title & Description</li>
          <li>Expiration Date</li>
          <li>Requested Quantity</li>
          <li>Revised Quantity</li>
        </ul>
      </div>
    ),
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="request-button"]',
    title: "Editing a Request",
    content: (
      <div>
        <p className="mb-2">Let&apos;s practice editing a request.</p>
        <strong>
          To start, click the{" "}
          <span className="text-red-primary">Edit Request</span> button.
        </strong>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tutorial="request-expanded"]',
    title: "Editing a Request",
    content: "This window is where you can update your request details.",
    placement: "right",
  },
  {
    target: '[data-tutorial="request-example"]',
    title: "Editing a Request",
    content: (
      <div>
        <p className="mb-2">
          Let&apos;s update this request to 12 units with high priority.
        </p>
        <ul>
          <li>
            In the <strong>Quantity</strong> box, use{" "}
            <strong>&quot;12&quot;</strong>.
          </li>
          <li>
            In the <strong>Priority</strong> box, select{" "}
            <strong>&quot;High&quot;</strong>.
          </li>
        </ul>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tutorial="request-success"]',
    title: "Editing a Request",
    content: (
      <div>
        <p>You have successfully updated the request details!</p>
        <strong>
          To complete this process, click{" "}
          <span className="text-red-primary">Update Request</span>.
        </strong>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tutorial="wishlist-tab"]',
    title: "Wishlist",
    content: (
      <div>
        If an item is unavailable, check your <strong>Wishlist</strong> tab.
      </div>
    ),
    placement: "right",
  },
  {
    target: "body",
    title: (
      <div>
        Tutorial Completed: <span className="text-red-primary">Requests</span>
      </div>
    ),
    content: <div>You are now ready to manage your requests.</div>,
    placement: "center",
  },
];

export default function PartnerRequestsScreen() {
  const { apiClient } = useApiClient();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequestDTO | null>(
    null
  );

  const tableRef = useRef<AdvancedBaseTableHandle<PartnerRequestDTO>>(null);
  const tutorialRowInsertedRef = useRef(false);
  const originalRequestsRef = useRef<PartnerRequestDTO[] | null>(null);

  const handleTutorialEnd = useCallback(() => {
    if (tutorialRowInsertedRef.current) {
      tableRef.current?.setItems(originalRequestsRef.current ?? []);
      tutorialRowInsertedRef.current = false;
      originalRequestsRef.current = null;
    }

    tableRef.current?.setFilterMenuOpen(false);
    setIsPopoverOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleTutorialStepChange = useCallback((stepIndex: number) => {
    tableRef.current?.setFilterMenuOpen(stepIndex === 2);

    const shouldKeepRequestPopoverOpen =
      stepIndex === 5 || stepIndex === 6 || stepIndex === 7;

    if (!shouldKeepRequestPopoverOpen) {
      setIsPopoverOpen(false);
      setSelectedRequest(null);
    }

    if (stepIndex === 3) {
      if (!tutorialRowInsertedRef.current) {
        const currentRequests = tableRef.current?.getAllItems() ?? [];
        originalRequestsRef.current = currentRequests;
        tutorialRowInsertedRef.current = true;

        const tutorialRequest: PartnerRequestDTO = {
          id: TUTORIAL_REQUEST_ROW_ID,
          quantity: 6,
          finalQuantity: 0,
          comments: null,
          priority: null,
          createdAt: new Date(),
          generalItem: {
            id: TUTORIAL_REQUEST_GENERAL_ITEM_ID,
            title: "Canned Vegetables",
            description: "Tutorial example request",
            expirationDate: new Date(),
            unitType: "Case",
            initialQuantity: 24,
            donorOffer: {
              id: TUTORIAL_REQUEST_DONOR_OFFER_ID,
              offerName: "Tutorial Offer",
              donorName: "Tutorial Donor",
              state: "ACTIVE",
              archivedAt: null,
            },
          },
        };

        tableRef.current?.setItems([tutorialRequest]);
      }
      return;
    }

    if (shouldKeepRequestPopoverOpen) {
      const currentRequests = tableRef.current?.getAllItems() ?? [];
      const tutorialRequest = currentRequests.find(
        (request) => request.id === TUTORIAL_REQUEST_ROW_ID
      );

      if (tutorialRequest) {
        setSelectedRequest(tutorialRequest);
        setIsPopoverOpen(true);
      }

      if (stepIndex !== 6) {
        return;
      }

      autoFillRequestExample();
    }
  }, []);

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
      if (request.id === TUTORIAL_REQUEST_ROW_ID) {
        tableRef.current?.updateItemById(request.id, {
          quantity: requestData.quantity,
          priority: requestData.priority,
          comments: requestData.comments,
        });
        toast.success("Request updated successfully!");
        setIsPopoverOpen(false);
        setSelectedRequest(null);
        return;
      }

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
            isTutorialTarget={request.id === TUTORIAL_REQUEST_ROW_ID}
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
            <div className="text-sm text-gray-500 mt-1">
              {request.generalItem.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "expirationDate",
      header: "Expiration",
      cell: (request) =>
        request.generalItem.expirationDate
          ? new Date(request.generalItem.expirationDate).toLocaleDateString()
          : "N/A",
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
    <div className="w-full px-4 pb-6 font-[Open_Sans]">
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="requests"
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />

      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-gray-primary m-0">
          My Requests
        </h1>
      </div>

      <div className="h-4"></div>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchRequests}
        rowId="id"
        pageSize={25}
        emptyState="No requests found."
        rowClassName={(request) =>
          request.id === TUTORIAL_REQUEST_ROW_ID ? "!bg-white" : undefined
        }
        filterButtonAttributes={{ "data-tutorial": "filter-button" }}
        getRowAttributes={(request) =>
          request.id === TUTORIAL_REQUEST_ROW_ID
            ? { "data-tutorial": "individual-item" }
            : undefined
        }
      />
    </div>
  );
}
