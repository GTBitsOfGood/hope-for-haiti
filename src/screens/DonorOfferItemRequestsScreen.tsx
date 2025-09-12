"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, ChatTeardropText } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DonorOffer,
  DonorOfferItem,
  DonorOfferItemRequest,
  DonorOfferItemRequestAllocation,
  Item,
} from "@prisma/client";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import BaseTable from "@/components/BaseTable";

type RequestWithAllocations = DonorOfferItemRequest & {
  donorOfferItem: DonorOfferItem;

  allocations: (DonorOfferItemRequestAllocation & {
    item: Item;
  })[];
  partner: {
    name: string;
  };
};

const Priority = ({ priority }: { priority: string | null }) => {
  let color = "bg-gray-200";
  if (priority === "HIGH") {
    color = "bg-red-primary";
  } else if (priority === "MEDIUM") {
    color = "bg-orange-primary";
  } else if (priority === "LOW") {
    color = "bg-green-dark";
  } else {
    color = "bg-gray-400";
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded-md bg-opacity-20 ${color}`}
    >
      {priority
        ? priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
        : "N/A"}
    </span>
  );
};

export default function DonorOfferItemRequestsScreen() {
  const router = useRouter();
  const { donorOfferId, itemId } = useParams();

  const [requests, setRequests] = useState<RequestWithAllocations[]>([]);
  const [donorOffer, setDonorOffer] = useState<DonorOffer>();
  const [donorOfferItem, setDonorOfferItem] = useState<DonorOfferItem>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItemRequests = async () => {
      try {
        const response = await fetch(
          `/api/donorOffers/items/${itemId}/requests`
        );

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();
        setRequests(data);
        console.log(data);
      } catch (e) {
        toast.error("Error fetching donor offer item request", {
          position: "bottom-right",
        });
        console.log(e);
      }
    };

    const fetchDonorOffer = async () => {
      try {
        const response = await fetch(`/api/donorOffers/${donorOfferId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();
        setDonorOffer(data.donorOffer);
        setDonorOfferItem(
          data.itemsWithRequests.find(
            (item: DonorOfferItem) => item.id === Number(itemId)
          )
        );
      } catch (e) {
        toast.error("Error fetching donor offer item request", {
          position: "bottom-right",
        });
        console.log(e);
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchItemRequests(), fetchDonorOffer()]);
      setIsLoading(false);
    };
    fetchData();
  }, [donorOfferId, itemId]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-4">
            <Link
              href="/donorOffers"
              className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
            >
              Donor Offers
            </Link>
            <span className="text-gray-500 text-sm flex items-center">/</span>
            <Link
              href={`/donorOffers/${donorOffer?.id}`}
              className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
            >
              {donorOffer?.offerName}
            </Link>
            <span className="text-gray-500 text-sm flex items-center">/</span>
            <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
              {donorOfferItem?.title}
            </span>
          </div>
          <h1 className="text-2xl font-semibold">
            {donorOfferItem?.title}:{" "}
            <span className="text-gray-primary text-opacity-70">
              Partner Requests
            </span>
          </h1>
          <div className="flex flex-row justify-between items-center mb-4">
            <div className="relative w-1/3 py-4">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:border-gray-400"
              />
            </div>
            <Link
              href={`/donorOffers/${donorOffer?.id}/itemRequests/${donorOfferItem?.id}/lineItems`}
              className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-1 rounded-md font-medium hover:bg-red-600 transition"
            >
              View Unique Line Items
            </Link>
          </div>
          <BaseTable
            headers={[
              "Partner",
              "Date requested",
              "Requested quantity",
              "Priority",
              "Allocated quantity",
              "Allocated summary (lot, pallet, box)",
              "Comment",
            ]}
            rows={requests.map((item) => ({
              cells: [
                item.partner.name,
                new Date(item.createdAt).toLocaleDateString(),
                item.quantity,
                <Priority priority={item.priority} key={1} />,

                item.allocations?.reduce(
                  (sum: number, alloc: DonorOfferItemRequestAllocation) =>
                    sum + alloc.quantity,
                  0
                ),
                item.allocations && item.allocations.length > 0 ? (
                  <div>
                    {item.allocations.map((alloc) => (
                      <div key={alloc.id}>
                        <span className="font-bold">{alloc.quantity}</span>
                        {` - ${alloc.item.lotNumber}, ${alloc.item.palletNumber}, ${alloc.item.boxNumber}`}
                      </div>
                    ))}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        router.push(
                          `/newDonorOfferAllocation?${new URLSearchParams({
                            donorOfferItemRequestId: item.id.toString(),
                            title: item.donorOfferItem.title,
                            type: item.donorOfferItem.type,
                            unitType: item.donorOfferItem.unitType,
                            quantityPerUnit:
                              item.donorOfferItem.quantityPerUnit.toString(),
                            ...(item.donorOfferItem.expirationDate
                              ? {
                                  expirationDate: item.donorOfferItem
                                    .expirationDate as unknown as string,
                                }
                              : {}),
                          }).toString()}`
                        );
                      }}
                      className="mt-1 rounded-md px-2 py-1 text-gray-primary bg-gray-primary bg-opacity-5 text-opacity-50 text-sm transition hover:bg-opacity-10 hover:text-opacity-70"
                    >
                      + Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(
                        `/newDonorOfferAllocation?${new URLSearchParams({
                          donorOfferItemRequestId: item.id.toString(),
                          title: item.donorOfferItem.title,
                          type: item.donorOfferItem.type,
                          unitType: item.donorOfferItem.unitType,
                          quantityPerUnit:
                            item.donorOfferItem.quantityPerUnit.toString(),
                          ...(item.donorOfferItem.expirationDate
                            ? {
                                expirationDate: item.donorOfferItem
                                  .expirationDate as unknown as string,
                              }
                            : {}),
                        }).toString()}`
                      );
                    }}
                    className="border-dashed border border-gray-primary rounded-md px-2 py-1 text-gray-primary opacity-50 text-sm transition hover:opacity-100"
                  >
                    + Add Allocation
                  </button>
                ),
                <div className="flex justify-center" key={1}>
                  <ChatTeardropText
                    data-tooltip-id={`comment-tooltip-${item.id}`}
                    data-tooltip-content={item.comments}
                    size={30}
                    color={item.comments ? "black" : "lightgray"}
                  />
                  {item.comments && (
                    <Tooltip
                      id={`comment-tooltip-${item.id}`}
                      className="max-w-40"
                    />
                  )}
                </div>,
              ],
            }))}
            headerClassName="bg-blue-primary opacity-80 text-white"
            pageSize={10}
          />
        </>
      )}
    </>
  );
}
