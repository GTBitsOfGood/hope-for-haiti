"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { RequestPriority } from "@prisma/client";

import CommentModalDonorOffers from "@/components/DonorOffers/CommentModalDonorOffers";
import {
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "@/app/api/donorOffers/[donorOfferId]/types";
import { formatTableValue } from "@/utils/format";

/**
 * Search bar and buttons cover the menu bar when looking at mobile view.
 *  - It's because the z-layer of the search bar and buttons is too high, but making it lower will make the cursor not become a pointer when hovering over the button.
 * There is a bug where after redirection, the home page icon disappears.
 * Bug where after reidrection, error is shown twice
 */

// Main component --------------------------------------------------------------
interface EditableRequest extends Omit<DonorOfferItemsRequestsDTO, "priority"> {
  priority?: RequestPriority | null;
  localId: number;
}

function parsePriority(value: string): RequestPriority | undefined {
  switch (value) {
    case "LOW":
      return RequestPriority.LOW;
    case "MEDIUM":
      return RequestPriority.MEDIUM;
    case "HIGH":
      return RequestPriority.HIGH;
    default:
      return undefined;
  }
}

function getPriorityColor(value: RequestPriority | ""): string {
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

function titleCasePriority(value: RequestPriority): string {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function PartnerDynamicDonorOfferScreen() {
  const { donorOfferId } = useParams();
  const router = useRouter();

  // Main data states
  const [donorOfferName, setDonorOfferName] = useState("");
  const [editedRequests, setEditedRequests] = useState<EditableRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/donorOffers/${donorOfferId}`, {
          method: "GET",
        });
        if (res.status === 404) {
          toast.error("Donor offer not found");
          router.push("/donorOffers");
          return;
        }
        const data = (await res.json()) as DonorOfferItemsRequestsResponse;
        setDonorOfferName(data.donorOfferName);
        const items = data.donorOfferItemsRequests ?? [];
        const withIds: EditableRequest[] = items.map((row, index) => ({
          ...row,
          priority: row.priority ?? null,
          localId: index,
        }));
        setEditedRequests(withIds);
        if (withIds.length === 0) {
          setIsEditing(true);
        }
      } catch (error) {
        toast.error("Failed to fetch donor offer data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [donorOfferId, router]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    localId: number
  ) => {
    const { name, value } = e.target;
    setEditedRequests((prev) =>
      prev.map((row) => {
        if (row.localId === localId) {
          if (name === "quantityRequested") {
            return {
              ...row,
              quantityRequested: value === "" ? 0 : parseInt(value, 10),
            };
          }
          if (name === "priority") {
            return {
              ...row,
              priority: parsePriority(value) ?? null,
            };
          }
        }
        return row;
      })
    );
  };

  const handleSubmitAll = async () => {
    const rowsToSave = editedRequests.filter(
      (r) =>
        r.quantityRequested > 0 ||
        r.priority != null ||
        (r.comments && r.comments.trim() !== "")
    );
    for (const r of rowsToSave) {
      const hasQty = r.quantityRequested > 0;
      const hasPrio = r.priority != null;
      if ((hasQty && !hasPrio) || (!hasQty && hasPrio)) {
        toast.error(
          "Both quantity and priority must be filled in for each updated row."
        );
        return;
      }
    }
    const finalRequests: DonorOfferItemsRequestsDTO[] = rowsToSave.map((r) => ({
      requestId: r.requestId,
      donorOfferItemId: r.donorOfferItemId,
      title: r.title,
      type: r.type,
      expiration: r.expiration,
      quantity: r.quantity,
      unitSize: r.unitSize,
      quantityRequested: r.quantityRequested,
      comments: r.comments,
      priority: r.priority,
    }));
    try {
      const res = await fetch(`/api/donorOffers/${donorOfferId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: finalRequests }),
      });
      if (!res.ok) {
        toast.error("Error updating donor offer items.");
        return;
      }
      toast.success("All changes saved to DB!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Network error while updating donor offer items.");
      console.error("Error in handleSubmitAll:", error);
    }
  };

  const handleCommentClick = (localId: number) => {
    const row = editedRequests.find((r) => r.localId === localId);
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
    const row = editedRequests.find((r) => r.requestId === selectedRequestId);
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
      quantity: row.quantity,
      unitSize: row.unitSize,
      quantityRequested: row.quantityRequested,
      comments: modalComment,
      priority: row.priority,
    };
    try {
      const res = await fetch(`/api/donorOffers/${donorOfferId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [payloadRow] }),
      });
      if (!res.ok) {
        toast.error("Error updating comment.");
        return;
      }
      setEditedRequests((prev) =>
        prev.map((r) =>
          r.requestId === selectedRequestId
            ? { ...r, comments: modalComment }
            : r
        )
      );
      toast.success("Comment updated!");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Error updating comment.");
    }
    setIsModalOpen(false);
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
        <div className="overflow-x-auto rounded-[12px]">
          <table className="w-full text-left border-collapse">
            <thead
              className="text-white text-[18px]"
              style={{
                backgroundColor: "rgba(39,116,174,0.8)",
                borderBottom: "2px solid rgba(34,7,11,0.1)",
              }}
            >
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Type</th>
                <th className="px-4 py-3">Qty/Unit</th>
                <th className="px-4 py-3">Quantity Requested</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Comment</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-b [&>tr]:border-[rgba(34,7,11,0.1)] [&>tr:last-child]:border-0 [&>tr:nth-child(odd)]:bg-[rgba(34,7,11,0.025)] [&>tr:nth-child(even)]:bg-white">
              {editedRequests.map((row, index) => (
                <tr
                  key={`${row.localId}-${row.donorOfferItemId}-${row.requestId}-${index}`}
                  className="text-[16px]"
                >
                  <td className="px-4 py-3">{formatTableValue(row.title)}</td>
                  <td className="px-4 py-3">{formatTableValue(row.type)}</td>
                  <td className="px-4 py-3">
                    {formatTableValue(row.expiration)}
                  </td>
                  <td className="px-4 py-3">
                    {formatTableValue(row.quantity)}
                  </td>
                  <td className="px-4 py-3">Bottle</td>
                  <td className="px-4 py-3">1</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        name="quantityRequested"
                        value={row.quantityRequested || ""}
                        onChange={(e) => handleInputChange(e, row.localId)}
                        className="w-[60px] bg-[rgba(249,249,249)] border-2 border-[rgba(34,7,11,0.1)] rounded-[4px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)]"
                      />
                    ) : (
                      formatTableValue(row.quantityRequested)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        name="priority"
                        value={row.priority ?? ""}
                        onChange={(e) => handleInputChange(e, row.localId)}
                        className="appearance-none -webkit-appearance-none text-[16px] text-[#22070B] border-2 border-[rgba(34,7,11,0.1)] rounded-[4px] px-2 py-1 w-auto focus:outline-none focus:ring-1 focus:ring-[rgba(34,7,11,0.1)]"
                        style={{
                          backgroundColor: getPriorityColor(row.priority ?? ""),
                          minWidth: "3rem",
                        }}
                      >
                        <option value="">Select</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    ) : row.priority ? (
                      <div
                        className="inline-block px-2 py-1 rounded-md text-center"
                        style={{
                          backgroundColor: getPriorityColor(row.priority),
                        }}
                      >
                        {titleCasePriority(row.priority)}
                      </div>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleCommentClick(row.localId)}>
                      <img
                        src="/assets/chat_sign.svg"
                        alt="Comment"
                        style={{ filter: commentIconFilter }}
                        className={`w-5 h-5 ${
                          row.comments ? "opacity-90" : "opacity-30"
                        } hover:opacity-100`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
