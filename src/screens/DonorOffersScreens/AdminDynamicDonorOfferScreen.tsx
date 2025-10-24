"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DonorOffer } from "@prisma/client";
import { formatTableValue } from "@/util/format";
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
import { CgChevronDown, CgChevronUp } from "react-icons/cg";

// Types for stream chunks
type StreamingChunk = {
  itemIndex: number;
  requests: { partnerId: number; finalQuantity: number }[];
};

type DoneChunk = {
  done: true;
};

type TestChunk = {
  test: string;
};

type ErrorChunk = {
  error: string;
};

type StreamChunk = StreamingChunk | DoneChunk | TestChunk | ErrorChunk;

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

  const updateItemRequests = useCallback(
    (
      itemId: number,
      updatedRequests: {
        partnerId: number;
        finalQuantity?: number;
        quantity?: number;
      }[]
    ) => {
      // Update table
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

      // Update currentItems state
      setCurrentItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              requests: item.requests.map((req) => {
                const updatedReq = updatedRequests.find(
                  (r) => r.partnerId === req.partner.id
                );
                if (updatedReq) {
                  const newQuantity =
                    updatedReq.finalQuantity ??
                    updatedReq.quantity ??
                    req.finalQuantity;
                  return {
                    ...req,
                    finalQuantity: newQuantity,
                  };
                }
                return req;
              }),
            };
          }
          return item;
        })
      );
    },
    []
  );

  const handleSuggestRevisions = useCallback(async () => {
    if (!donorOfferId) return;

    setPreStreamState(currentItems);
    setIsLLMMode(true);
    setIsStreamComplete(false);

    // Helper function to process a chunk
    const processChunk = (chunk: StreamChunk) => {
      if ("test" in chunk) {
        return;
      }

      if ("error" in chunk) {
        toast.error(`Stream error: ${chunk.error}`);
        return;
      }

      if ("done" in chunk && chunk.done) {
        return;
      }

      // Handle streaming chunk
      if ("itemIndex" in chunk && "requests" in chunk) {
        const currentItem = currentItems[chunk.itemIndex];
        if (currentItem) {
          updateItemRequests(currentItem.id, chunk.requests);
        }
      }
    };

    let buffer = "";
    const pendingMessages: StreamChunk[] = [];

    try {
      await streamClient.stream("/api/suggest/unfinalized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorOfferId: parseInt(String(donorOfferId)) }),
        parseChunk: (rawChunk: string) => {
          buffer += rawChunk;

          const parts = buffer.split("\n\n");

          buffer = parts.pop() || "";

          for (const part of parts) {
            if (part.trim().startsWith("data: ")) {
              const data = part.substring(part.indexOf("data: ") + 6).trim();
              if (data) {
                try {
                  const parsed = JSON.parse(data) as StreamChunk;
                  pendingMessages.push(parsed);
                } catch (e) {
                  console.error("Failed to parse SSE data:", data, e);
                }
              }
            }
          }

          return pendingMessages.shift() || ({ test: "" } as StreamChunk);
        },
        onChunk: (chunk) => {
          if (!chunk) return;
          while (pendingMessages.length > 0) {
            const pending = pendingMessages.shift()!;
            processChunk(pending);
          }

          processChunk(chunk);
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

      const updates: Array<{
        requestId: number;
        finalQuantity: number;
      }> = [];

      for (const item of currentItems) {
        for (const request of item.requests) {
          if (request.finalQuantity !== request.quantity) {
            updates.push({
              requestId: request.id,
              finalQuantity: request.finalQuantity,
            });
          }
        }
      }

      if (updates.length === 0) {
        toast("No changes to save");
        setIsLLMMode(false);
        setIsStreamComplete(false);
        return;
      }

      await apiClient.patch(`/api/requests/bulk`, {
        body: JSON.stringify({ updates }),
      });

      toast.success(
        `Revisions saved successfully (${updates.length} requests updated)`
      );
      setIsLLMMode(false);
      setIsStreamComplete(false);
    } catch (error) {
      toast.error("Failed to save revisions");
      console.error("Save error:", error);
    }
  }, [apiClient, currentItems]);

  const handleRequestUpdated = useCallback(
    (itemId?: number, updatedRequests?: PartnerRequestChipData[]) => {
      if (isLLMMode && itemId && updatedRequests) {
        // In LLM mode, update the specific item without reloading
        tableRef.current?.updateItemById(itemId, (currentItem) => {
          return {
            ...currentItem,
            requests: currentItem.requests.map((req) => {
              const updatedReq = updatedRequests.find((r) => r.id === req.id);
              if (updatedReq) {
                return {
                  ...req,
                  finalQuantity: updatedReq.finalQuantity,
                };
              }
              return req;
            }),
          };
        });

        // Also update currentItems state
        setCurrentItems((prevItems) =>
          prevItems.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                requests: item.requests.map((req) => {
                  const updatedReq = updatedRequests.find(
                    (r) => r.id === req.id
                  );
                  if (updatedReq) {
                    return {
                      ...req,
                      finalQuantity: updatedReq.finalQuantity,
                    };
                  }
                  return req;
                }),
              };
            }
            return item;
          })
        );
      } else {
        // Not in LLM mode, reload the table
        tableRef.current?.reload();
      }
    },
    [isLLMMode]
  );

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
          isLLMMode={isLLMMode}
        />
      );
    },
    [handleRequestUpdated, isLLMMode]
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
