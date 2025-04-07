"use client";

import React, { useEffect, useState } from "react";
import { DonorOffer, DonorOfferItem, Item } from "@prisma/client";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ChatTeardropText, DotsThree } from "@phosphor-icons/react";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { Tooltip } from "react-tooltip";
import { formatTableValue } from "@/utils/format";

interface StatusTagProps {
  value: boolean;
  trueText: string;
  falseText: string;
  grayWhenFalse?: boolean;
}

const StatusTag = ({
  value,
  trueText,
  falseText,
  grayWhenFalse = false,
}: StatusTagProps) => (
  <span
    className={`inline-block px-2 py-1 rounded-md text-sm ${
      value
        ? "bg-green-50 text-green-700"
        : grayWhenFalse
          ? "bg-gray-100 text-gray-700"
          : "bg-red-50 text-red-700"
    }`}
  >
    {value ? trueText : falseText}
  </span>
);

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
          <div className="overflow-x-scroll pb-2">
            <table className="mt-4 min-w-full">
              <thead>
                <tr className="bg-blue-primary opacity-80 text-white font-bold border-b-2">
                  <th className="px-4 py-2 min-w-32 rounded-tl-lg text-left">
                    Quantity
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">Donor name</th>
                  <th className="px-4 py-2 min-w-32 text-left">
                    Pallet number
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">Box number</th>
                  <th className="px-4 py-2 min-w-32 text-left">Lot number</th>
                  <th className="px-4 py-2 min-w-32 text-left">Unit price</th>
                  <th className="px-4 py-2 min-w-32 text-left">
                    Donor Shipping #
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">
                    HfH Shipping #
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">Max Limit</th>
                  <th className="px-4 py-2 min-w-32 text-left">Visibility</th>
                  <th className="px-4 py-2 min-w-32 text-left">Allocation</th>
                  <th className="px-4 py-2 min-w-32 text-left">GIK</th>
                  <th className="px-4 py-2 text-left">Comment</th>
                  <th className="px-4 py-2 rounded-tr-lg text-left w-12">
                    Manage
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr
                      data-odd={index % 2 !== 0}
                      className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors`}
                    >
                      <td className="px-4 py-2">
                        {formatTableValue(item.quantity)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.donorName)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.palletNumber)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.boxNumber)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.lotNumber)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.unitPrice)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.donorShippingNumber)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.hfhShippingNumber)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.maxRequestLimit)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusTag
                          value={item.visible}
                          trueText="Visible"
                          falseText="Disabled"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <StatusTag
                          value={item.allowAllocations}
                          trueText="Allowed"
                          falseText="Disabled"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <StatusTag
                          value={item.gik}
                          trueText="GIK"
                          falseText="Not GIK"
                          grayWhenFalse
                        />
                      </td>
                      <td className="px-4 py-2 flex justify-center">
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
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end">
                          <DotsThree weight="bold" />
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
