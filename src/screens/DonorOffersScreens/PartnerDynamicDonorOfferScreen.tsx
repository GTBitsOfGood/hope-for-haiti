"use client";

import { useParams, useRouter } from "next/navigation";
import {
  DonorOfferItemsRequestsDTO,
  DonorOfferItemsRequestsResponse,
} from "@/app/api/donorOffers/[donorOfferId]/types";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { CgComment, CgSpinner } from "react-icons/cg";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RequestPriority } from "@prisma/client";

/**
 * Search bar and buttons cover the menu bar when looking at mobile view.
 *  - It's because the z-layer of the search bar and buttons is too high, but making it lower will make the cursor not become a pointer when hovering over the button.
 * There is a bug where after redirection, the home page icon disappears.
 * Bug where after reidrection, error is shown twice
 */

// Comment modal component -----------------------------------------------------
interface CommentModalProps {
  parentItemName: string;
  isOpen: boolean;
  onClose: () => void;
  comment: string;
}

const CommentModal: React.FC<CommentModalProps> = ({
  parentItemName,
  isOpen,
  onClose,
  comment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-7 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-3xl text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {parentItemName}: Comment
        </h2>
        <p className="text-gray-600 mb-2">Comment</p>
        <div className="border border-gray-200 bg-gray-100 rounded-lg p-4">
          <p className="mb-4">{comment}</p>
        </div>
      </div>
    </div>
  );
};
// -----------------------------------------------------------------------------

// Main component --------------------------------------------------------------
export default function PartnerDynamicDonorOfferScreen() {
  const { donorOfferId } = useParams(); // Gets the donor offer ID from the URL
  const [donorOfferName, setDonorOfferName] = useState(""); // Stores Donor offer name
  const [donorOfferItemsRequests, setDonorOfferItemsRequests] = useState<
    DonorOfferItemsRequestsDTO[]
  >([]); // Stores donor offer items requests, basically all the item requests under the donor
  const [isLoading, setIsLoading] = useState(true); // Manage the table loading

  const [isModalOpen, setIsModalOpen] = useState(false); // Manage the comment modal
  const [selectedComment, setSelectedComment] = useState(""); // Stores the selected comment, to be used when comment is open
  const [selectedItemName, setSelectedItemName] = useState(""); // Stores the selected item name, to be used when comment is open

  const router = useRouter();

  // Gets the donor items requests
  useEffect(() => {
    setTimeout(async () => {
      // Fetch donor offer
      const response = await fetch(`/api/donorOffers/${donorOfferId}`, {
        method: "GET",
      });
      const data = await response.json();
      if (response.status === 404) {
        toast.error("Donor offer not found"); // Bug where error message is shown twice
        router.push("/donorOffers"); // Redirect to donor offers page, bug where homepage icon disappears
        return;
      }
      const goodResponse = data as DonorOfferItemsRequestsResponse;
      setDonorOfferName(goodResponse.donorOfferName);
      setDonorOfferItemsRequests(goodResponse.donorOfferItemsRequests);
      setIsLoading(false);
    }, 1000);
  }, []);
  // ---------------------------------------------------------------------------

  // Open and close comment window hooks
  const handleCommentClick = (itemName: string, comment: string) => {
    setSelectedComment(comment);
    setSelectedItemName(itemName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedComment("");
    setSelectedItemName("");
  };
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="text-sm mb-4 items-center">
        <Link href="/donorOffers" className="hover:underline">
          Donor Offers
        </Link>
        <span className="mx-3">/</span>
        <span className="bg-clip-padding p-1 bg-gray-100 rounded-sm">
          {donorOfferName}
        </span>
      </nav>

      <h1 className="text-2xl font-semibold">{donorOfferName}</h1>

      {/* search bar and edit button */}
      <div className="flex justify-between items-center w-full py-4 mt-3 relative">
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

        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-2 rounded-lg font-medium hover:bg-red-400 transition">
            Edit
          </button>
        </div>
      </div>

      {/* table */}
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <div className="overflow-x-scroll">
          <table className="mt-4 rounded-t-lg overflow-hidden table-auto w-full">
            <thead>
              <tr className="bg-blue-primary bg-opacity-80 text-white text-opacity-100 border-b-2 break-words">
                <th className="px-4 py-2 text-left font-bold whitespace-nowrap min-w-[150px]">
                  Title
                </th>
                <th className="px-4 py-2 text-left font-semibold whitespace-nowrap min-w-[150px]">
                  Type
                </th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap min-w-[150px]">
                  Expiration
                </th>
                <th className="px-4 py-2 text-left font-bold whitespace-nowrap min-w-[150px]">
                  Quantity
                </th>
                <th className="px-4 py-2 text-left font-semibold whitespace-nowrap min-w-[150px]">
                  Unit size
                </th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap min-w-[150px]">
                  Quantity requested
                </th>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap min-w-[150px]">
                  Priority
                </th>
                <th className="pl-4 py-2 text-left font-normal whitespace-nowrap min-w-[150px]">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Maps the donor offer items requests */}
              {donorOfferItemsRequests.map((request, index) => (
                <React.Fragment key={request.requestId}>
                  <tr
                    data-odd={index % 2 !== 1}
                    className={`bg-white data-[odd=true]:bg-gray-100 break-words`}
                  >
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.title}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.type}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.expiration}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.quantity}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.unitSize}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.quantityRequested}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      {request.priority === RequestPriority.LOW && (
                        <div className="inline-block bg-clip-padding p-1 bg-green-200 rounded-md">
                          Low
                        </div>
                      )}
                      {request.priority === RequestPriority.MEDIUM && (
                        <div className="inline-block bg-clip-padding p-1 bg-orange-200 rounded-md">
                          Med
                        </div>
                      )}
                      {request.priority === RequestPriority.HIGH && (
                        <div className="inline-block bg-clip-padding p-1 bg-red-200 rounded-md">
                          High
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap min-w-[150px]">
                      <button
                        onClick={() =>
                          handleCommentClick(request.title, request.comments)
                        }
                      >
                        <CgComment
                          className={`w-6 h-6 ${request.comments ? "text-gray-700" : "text-gray-400"}`}
                        />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CommentModal
        parentItemName={selectedItemName}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        comment={selectedComment}
      />
    </>
  );
}
// -----------------------------------------------------------------------------
