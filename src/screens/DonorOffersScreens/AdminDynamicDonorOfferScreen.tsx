"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DonorOffer } from "@prisma/client";
import { formatTableValue } from "@/utils/format";
import { useApiClient } from "@/hooks/useApiClient";
import { useStreamClient } from "@/hooks/useStreamClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  ColumnDefinition,
} from "@/components/baseTable/AdvancedBaseTable";
import PartnerRequestChipGroup, {
  PartnerRequestChipData,
} from "@/components/DonorOffers/PartnerRequestChipGroup";
import toast from "react-hot-toast";

// Types for stream chunks
type StreamingChunk = {
  itemIndex: number;
  requests: { partnerId: number; finalQuantity: number }[];
};

type FinalResultChunk = {
  done: true;
  result: {
    items: { requests: { partnerId: number; quantity: number }[] }[];
  };
};

type TestChunk = {
  test: string;
};

type ErrorChunk = {
  error: string;
};

type StreamChunk = StreamingChunk | FinalResultChunk | TestChunk | ErrorChunk;

type GeneralItemWithRequests = {
  id: number;
  title: string;
  type: string;
  expirationDate: string | Date | null;
  unitType: string;
  quantityPerUnit: number;
  initialQuantity: number;
  requestQuantity: number | null;
  requests: {
    id: number;
    quantity: number;
    finalQuantity: number;
    partner: { id: number; name: string };
  }[];
};

type AdminDonorOfferDetails = {
  donorOffer: DonorOffer;
  itemsWithRequests: GeneralItemWithRequests[];
};

export default function AdminDynamicDonorOfferScreen() {
  const { donorOfferId } = useParams();
  const tableRef =
    useRef<AdvancedBaseTableHandle<GeneralItemWithRequests>>(null);
  const { apiClient } = useApiClient();
  const { isStreaming, streamClient } = useStreamClient<StreamChunk>();

  const [isLLMMode, setIsLLMMode] = useState(false);
  const [preStreamState, setPreStreamState] = useState<
    GeneralItemWithRequests[]
  >([]);
  const [isStreamComplete, setIsStreamComplete] = useState(false);
  const [currentItems, setCurrentItems] = useState<GeneralItemWithRequests[]>(
    []
  );

  const fetchItems = useCallback(
    async (pageSize: number, page: number) => {
      const data = await apiClient.get<AdminDonorOfferDetails>(
        `/api/donorOffers/${donorOfferId}`,
        { cache: "no-store" }
      );

      const items = data.itemsWithRequests;
      setCurrentItems(items);
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);
      return { data: paged, total: items.length };
    },
    [apiClient, donorOfferId]
  );

  const columns: ColumnDefinition<GeneralItemWithRequests>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Item Name",
        cell: (i) => i.title,
        filterType: "string",
      },
      { id: "type", header: "Type", cell: (i) => i.type, filterType: "string" },
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
        id: "quantityPerUnit",
        header: "Qty/Unit",
        cell: (i) => i.quantityPerUnit,
      },
      {
        id: "initialQuantity",
        header: "Quantity",
        cell: (i) => i.initialQuantity,
      },
      {
        id: "requestSummary",
        header: "Request Summary",
        cell: (i) => {
          const totalQty = i.requests.reduce(
            (s, r) =>
              s +
              (r.finalQuantity !== r.quantity ? r.finalQuantity : r.quantity),
            0
          );
          return (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">↓</span>
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

  const updateItemRequests = useCallback(
    (
      itemId: number,
      updatedRequests: {
        partnerId: number;
        finalQuantity?: number;
        quantity?: number;
      }[]
    ) => {
      tableRef.current?.updateItemById(itemId, (currentItem) => {
        const updatedItem = {
          ...currentItem,
          requests: currentItem.requests.map((req) => {
            const updatedReq = updatedRequests.find(
              (r) => r.partnerId === req.partner.id
            );
            if (updatedReq) {
              const newQuantity =
                updatedReq.finalQuantity ??
                updatedReq.quantity ??
                req.finalQuantity;
              console.log(
                "Updating request:",
                req.id,
                "from",
                req.finalQuantity,
                "to",
                newQuantity
              );
              return {
                ...req,
                finalQuantity: newQuantity,
              };
            }
            return req;
          }),
        };
        return updatedItem;
      });
    },
    []
  );

  const handleSuggestRevisions = useCallback(async () => {
    if (!donorOfferId) return;

    setPreStreamState(currentItems);
    setIsLLMMode(true);
    setIsStreamComplete(false);

    try {
      await streamClient.stream("/api/suggest/unfinalized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorOfferId: parseInt(String(donorOfferId)) }),
        parseChunk: (chunk) => {
          console.log("Raw chunk received:", chunk);
          if (chunk.startsWith("data: ")) {
            const data = chunk.substring(6);
            try {
              return JSON.parse(data);
            } catch {
              console.log("Failed to parse SSE data:", data);
              return null;
            }
          }
          return null;
        },
        onChunk: (chunk) => {
          console.log("Frontend received chunk:", chunk);

          if ("test" in chunk) {
            console.log("Test chunk received:", chunk.test);
            return;
          }

          if ("error" in chunk) {
            console.error("Error chunk received:", chunk.error);
            toast.error(`Stream error: ${chunk.error}`);
            return;
          }

          if ("done" in chunk && chunk.done && chunk.result) {
            console.log("Final result received:", chunk.result);
            chunk.result.items.forEach(
              (
                item: { requests: { partnerId: number; quantity: number }[] },
                index: number
              ) => {
                if (item.requests && item.requests.length > 0) {
                  console.log(
                    "Processing final result for item:",
                    index,
                    item.requests
                  );

                  const currentItem = currentItems[index];
                  if (currentItem) {
                    console.log("Found current item:", currentItem.id);
                    updateItemRequests(currentItem.id, item.requests);
                  }
                }
              }
            );

            setCurrentItems((prevItems) =>
              prevItems.map((prevItem, index) => {
                const resultItem = chunk.result.items[index];
                if (
                  resultItem &&
                  resultItem.requests &&
                  resultItem.requests.length > 0
                ) {
                  return {
                    ...prevItem,
                    requests: prevItem.requests.map((req) => {
                      const updatedReq = resultItem.requests.find(
                        (r: { partnerId: number }) =>
                          r.partnerId === req.partner.id
                      );
                      return updatedReq
                        ? { ...req, finalQuantity: updatedReq.quantity }
                        : req;
                    }),
                  };
                }
                return prevItem;
              })
            );
            return;
          }

          // Handle streaming chunk
          if ("itemIndex" in chunk && "requests" in chunk) {
            console.log("Processing chunk for item:", chunk.itemIndex);
            const currentItem = currentItems[chunk.itemIndex];
            if (currentItem) {
              updateItemRequests(currentItem.id, chunk.requests);
            }
          }
        },
        onDone: () => {
          setIsStreamComplete(true);
        },
        onError: (error) => {
          toast.error("Failed to get LLM suggestions");
          console.error("Streaming error:", error);
          setIsLLMMode(false);
        },
      });
    } catch (error) {
      toast.error("Failed to start LLM suggestions");
      console.error("Error:", error);
      setIsLLMMode(false);
    }
  }, [donorOfferId, streamClient, currentItems, updateItemRequests]);

  const handleCancel = useCallback(() => {
    streamClient.cancel();
    setIsLLMMode(false);
    setIsStreamComplete(false);

    if (preStreamState.length > 0) {
      tableRef.current?.setItems(preStreamState);
    }
  }, [streamClient, preStreamState]);

  const handleUndo = useCallback(() => {
    setIsLLMMode(false);
    setIsStreamComplete(false);

    if (preStreamState.length > 0) {
      console.log("Reverting to pre-stream state");
      tableRef.current?.setItems(preStreamState);
      setCurrentItems(preStreamState);
    }
  }, [preStreamState]);

  const handleKeep = useCallback(async () => {
    try {
      console.log("Saving revisions for items:", currentItems.length);

      const requestsToUpdate: Array<{
        generalItemId: number;
        requestId: number;
        finalQuantity: number;
      }> = [];

      for (const item of currentItems) {
        for (const request of item.requests) {
          if (request.finalQuantity !== request.quantity) {
            requestsToUpdate.push({
              generalItemId: item.id,
              requestId: request.id,
              finalQuantity: request.finalQuantity,
            });
          }
        }
      }

      console.log("Requests to update:", requestsToUpdate);

      await Promise.all(
        requestsToUpdate.map(({ generalItemId, requestId, finalQuantity }) =>
          apiClient.patch(
            `/api/generalItems/${generalItemId}/requests/${requestId}`,
            {
              body: JSON.stringify({ finalQuantity }),
            }
          )
        )
      );

      toast.success(
        `Revisions saved successfully (${requestsToUpdate.length} requests updated)`
      );
      setIsLLMMode(false);
      setIsStreamComplete(false);
    } catch (error) {
      toast.error("Failed to save revisions");
      console.error("Save error:", error);
    }
  }, [apiClient, currentItems]);

  const handleRequestUpdated = useCallback(() => {
    tableRef.current?.reload();
  }, []);

  const rowBody = useCallback(
    (item: GeneralItemWithRequests) => {
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
          onRequestUpdated={handleRequestUpdated}
        />
      );
    },
    [handleRequestUpdated]
  );

  return (
    <div>
      <div className="flex flex-row justify-between items-center mb-4">
        <div className="flex items-center gap-1">
          <Link
            href="/donorOffers"
            className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
          >
            Donor Offers
          </Link>
          <span className="text-gray-500 text-sm flex items-center">/</span>
          <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
            {formatTableValue(String(donorOfferId))}
          </span>
        </div>
      </div>

      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchItems}
        rowId="id"
        rowBody={rowBody}
        pageSize={20}
        toolBar={
          !isLLMMode ? (
            <button
              onClick={handleSuggestRevisions}
              className="px-4 py-2 bg-blue-primary text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isStreaming}
            >
              Suggest Revisions
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isStreaming && (
                <span className="text-blue-primary text-sm mr-2">
                  Streaming suggestions...
                </span>
              )}
              {isStreamComplete && !isStreaming && (
                <span className="text-green-primary text-sm mr-2">
                  Stream complete
                </span>
              )}
              {isStreaming ? (
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-red-primary text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : isStreamComplete ? (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1 bg-gray-primary text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Undo
                </button>
              ) : null}
              <button
                onClick={handleKeep}
                className="px-3 py-1 bg-green-primary text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={isStreaming}
              >
                Keep
              </button>
            </div>
          )
        }
      />
    </div>
  );
}
