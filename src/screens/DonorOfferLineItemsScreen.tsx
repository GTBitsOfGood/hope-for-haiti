"use client";

import React, { useEffect, useState } from "react";
import { DonorOffer, DonorOfferItem, Item } from "@prisma/client";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ChatTeardropText, DotsThree } from "@phosphor-icons/react";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { Tooltip } from "react-tooltip";
import StatusTag from "@/components/StatusTag";
import BaseTable, { extendTableHeader } from "@/components/BaseTable";

export default function DonorOfferLineItemsScreen() {
  const { donorOfferId, itemId } = useParams();

  const [lineItems, setLineItems] = useState<Item[]>([]);
  const [donorOffer, setDonorOffer] = useState<DonorOffer>();
  const [donorOfferItem, setDonorOfferItem] = useState<DonorOfferItem>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItemRequests = async () => {
      try {
        const response = await fetch(
          `/api/donorOffers/items/${itemId}/lineItems`
        );

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();
        console.log(data);
        setLineItems(data);
      } catch (e) {
        toast.error("Error fetching donor offer line items", {
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
        toast.error("Error fetching donor offer", {
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
  }, [itemId, donorOfferId]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1 pb-8">
            <div className="flex items-center gap-1">
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
              <Link
                href={`/donorOffers/${donorOffer?.id}/itemRequests/${donorOfferItem?.id}`}
                className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
              >
                {donorOfferItem?.title}
              </Link>
              <span className="text-gray-500 text-sm flex items-center">/</span>
              <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
                Unique line items
              </span>
            </div>

            <Link
              href={`/donorOffers/${donorOffer?.id}/itemRequests/${donorOfferItem?.id}`}
              className="flex items-center border gap-2 text-center text-red-500 border-red-500 bg-white px-4 py-1 rounded-lg font-medium hover:bg-red-50 transition"
            >
              Back to Partner Requests
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">
            {donorOfferItem?.title}:{" "}
            <span className="text-gray-primary text-opacity-70">
              Unique Line Items
            </span>
          </h1>
          <h2 className="text-xl font-light text-gray-500 pt-4 pb-4">
            A list of all the unique items for this item.
          </h2>
          <div className="overflow-x-auto">
            <BaseTable
              headers={[
                "Quantity",
                "Donor name",
                "Pallet",
                "Box number",
                "Lot number",
                "Unit price",
                "Donor Shipping #",
                "HfH Shipping #",
                "Max Limit",
                "Visibility",
                "Allocation",
                "GIK",
                "Comment",
                extendTableHeader("Manage", "w-12"),
              ]}
              rows={lineItems.map((item) => ({
                cells: [
                  item.quantity,
                  item.donorName,
                  item.palletNumber,
                  item.boxNumber,
                  item.lotNumber,
                  item.unitPrice.toString(),
                  item.donorShippingNumber,
                  item.hfhShippingNumber,
                  item.maxRequestLimit,
                  <StatusTag
                    value={item.visible}
                    trueText="Visible"
                    falseText="Disabled"
                    key={1}
                  />,
                  <StatusTag
                    value={item.allowAllocations}
                    trueText="Allowed"
                    falseText="Disabled"
                    key={2}
                  />,
                  <StatusTag
                    value={item.gik}
                    trueText="GIK"
                    falseText="Not GIK"
                    grayWhenFalse
                    key={3}
                  />,
                  <div className="flex justify-center" key={4}>
                    <ChatTeardropText
                      data-tooltip-id={`comment-tooltip-${item.id}`}
                      data-tooltip-content={item.notes}
                      size={30}
                      color={item.notes ? "black" : "lightgray"}
                    />
                    {item.notes && (
                      <Tooltip
                        id={`comment-tooltip-${item.id}`}
                        className="max-w-40"
                      >
                        {item.notes}
                      </Tooltip>
                    )}
                  </div>,
                  <div className="flex justify-end" key={5}>
                    <DotsThree weight="bold" />
                    {/* TODO: ADD MENU OPTIONS */}
                  </div>,
                ],
              }))}
              headerCellStyles="min-w-32"
              
            />
          </div>
        </>
      )}
    </>
  );
}
