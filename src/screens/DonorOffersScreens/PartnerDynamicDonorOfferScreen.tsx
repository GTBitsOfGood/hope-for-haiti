"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { RequestPriority } from "@prisma/client";

import CommentModalDonorOffers from "@/components/DonorOffers/CommentModalDonorOffers";
import {
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "@/types/api/donorOffer.types";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import BaseTable, { tableConditional } from "@/components/BaseTable";

/**
 * Search bar and buttons cover the menu bar when looking at mobile view.
 *  - It's because the z-layer of the search bar and buttons is too high, but making it lower will make the cursor not become a pointer when hovering over the button.
 * There is a bug where after redirection, the home page icon disappears.
 * Bug where after reidrection, error is shown twice
 */

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

  // Main data states
  const [donorOfferName, setDonorOfferName] = useState("");
  const [items, setItems] = useState<DonorOfferItemsRequestsDTO[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Modal states for comment updates
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalComment, setModalComment] = useState("");
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedDonorOfferItemId, setSelectedDonorOfferItemId] = useState<
    number | null
  >(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
    null
  );

  const { isLoading, refetch: refetchDonorOffer } =
    useFetch<DonorOfferItemsRequestsResponse>(
      `/api/donorOffers/${donorOfferId}`,
      {
        method: "GET",
        onSuccess: (data) => {
          setDonorOfferName(data.donorOfferName);
          const items = data.donorOfferItemsRequests;
          setItems(items);
          if (
            items.some(
              (item: DonorOfferItemsRequestsDTO) => item.requestId === null
            )
          ) {
            setIsEditing(true);
          }
        },
        onError: (error) => {
          if (error.includes("404")) {
            toast.error("Donor offer not found");
            router.push("/donorOffers");
          } else {
            toast.error("Failed to fetch donor offer data");
            console.error("Fetch error:", error);
          }
        },
      }
    );

  const { apiClient } = useApiClient();

  const updateItem = (
    index: number,
    changes: Partial<DonorOfferItemsRequestsDTO>
  ) =>
    setItems((prev) => {
      const newVal = [...prev];
      newVal[index] = { ...newVal[index], ...changes };

      return newVal;
    });

  const handleSubmitAll = async () => {
    if (
      items.some(
        (item) =>
          (item.quantityRequested || 0) > 0 && (item.priority || "") === ""
      )
    )
      return toast.error("Must set priority if requesting an item");

    try {
      await apiClient.post(`/api/donorOffers/${donorOfferId}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: items }),
      });
      toast.success("All changes saved to DB!");
      setIsEditing(false);
    } catch {
      toast.error("Error updating donor offer items.");
    }
  };

  const handleCommentClick = (index: number) => {
    const row = items[index];
    if (!row) return;
    setSelectedRequestId(row.requestId ?? null);
    setSelectedDonorOfferItemId(row.donorOfferItemId);
    setSelectedItemName(row.title);
    setModalComment(row.comments ?? "");
    setIsModalOpen(true);
  };

  const handleModalSaveComment = async () => {
    if (selectedRequestId == null) {
      setIsModalOpen(false);
      return;
    }
    const row = items.find((r) => r.requestId === selectedRequestId);
    if (!row) {
      setIsModalOpen(false);
      return;
    }
    const payloadRow: DonorOfferItemsRequestsDTO = {
      requestId: row.requestId,
      donorOfferItemId: row.donorOfferItemId,
      title: row.title,
      type: row.type,
      expiration: row.expiration,
      initialQuantity: row.initialQuantity,
      unitSize: row.unitSize,
      quantityRequested: row.quantityRequested,
      comments: modalComment,
      priority: row.priority,
    };
    // Update local state immediately for better UX
    setItems((prev) =>
      prev.map((r) =>
        r.requestId === selectedRequestId ? { ...r, comments: modalComment } : r
      )
    );

    try {
      await apiClient.post(`/api/donorOffers/${donorOfferId}`, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [payloadRow] }),
      });
      toast.success("Comment updated successfully!");
      setIsModalOpen(false);
      refetchDonorOffer();
    } catch {
      toast.error("Error updating comment.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalComment("");
    setSelectedItemName("");
    setSelectedDonorOfferItemId(null);
    setSelectedRequestId(null);
  };

  const commentIconFilter = isEditing
    ? "invert(53%) sepia(37%) saturate(2961%) hue-rotate(181deg) brightness(96%) contrast(92%)"
    : "none";

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
      <div className="flex items-center justify-between py-4 mt-3">
        <div className="relative w-2/3">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full border border-gray-primary border-opacity-10 rounded-lg bg-gray-100 text-gray-primary focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="ml-4 flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-white border-2 border-[#EF3340] text-[#EF3340] font-medium py-2 px-4 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAll}
                className="bg-[#EF3340] text-white font-medium py-2 px-4 rounded-md hover:bg-[#a32027]"
              >
                Submit
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#EF3340] text-white font-medium py-2 px-4 rounded-md hover:bg-[#a32027]"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-12 h-12 animate-spin opacity-50" />
        </div>
      ) : (
        <BaseTable
          headers={[
            "Title",
            "Type",
            "Expiration",
            "Quantity",
            "Unit Type",
            "Qty/Unit",
            "Quantity Requested",
            "Priority",
            "Comment",
          ]}
          rows={items.map((item, index) => ({
            cells: [
              item.title,
              item.type,
              item.expiration,
              item.initialQuantity,
              "Bottle",
              "1", // Hardcoded -- replace when possible
              tableConditional(
                isEditing,
                [
                  <input
                    type="number"
                    name="quantityRequested"
                    min={0}
                    key="quantityRequested"
                    value={item.quantityRequested || 0}
                    onChange={(e) =>
                      updateItem(index, {
                        quantityRequested: parseInt(e.currentTarget.value),
                      })
                    }
                    className="w-[60px] bg-[rgba(249,249,249)] border-2 border-[rgba(34,7,11,0.1)] rounded-[4px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)]"
                  />,
                  <select
                    name="priority"
                    key="priority"
                    value={item.priority ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        priority: e.currentTarget.value as RequestPriority,
                      })
                    }
                    className="appearance-none -webkit-appearance-none text-[16px] text-[#22070B] border-2 border-[rgba(34,7,11,0.1)] rounded-[4px] px-2 py-1 w-auto focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)]"
                    style={{
                      backgroundColor: getPriorityColor(item.priority ?? ""),
                      minWidth: "3rem",
                    }}
                  >
                    <option value="">Select</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>,
                ],
                [
                  item.quantityRequested,
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
                    ""
                  ),
                ]
              ),

              <button onClick={() => handleCommentClick(index)} key="comments">
                <Image
                  src="/assets/chat_sign.svg"
                  alt="Comment"
                  width={20}
                  height={20}
                  style={{ filter: commentIconFilter }}
                  className={`${
                    item.comments ? "opacity-90" : "opacity-30"
                  } hover:opacity-100`}
                  key="commentIcon"
                />
              </button>,
            ],
          }))}
        />
      )}

      <CommentModalDonorOffers
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        donorOfferItemId={selectedDonorOfferItemId ?? 0}
        itemName={selectedItemName}
        comment={modalComment}
        setComment={setModalComment}
        onModalSave={handleModalSaveComment}
      />
    </div>
  );
}
