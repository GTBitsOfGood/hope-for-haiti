"use client";

import { useEffect, useState } from "react";
import { DotsThree, MagnifyingGlass, ShareFat } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  DonorOffer,
  DonorOfferItem,
  DonorOfferItemRequest,
  DonorOfferState,
} from "@prisma/client";
import toast from "react-hot-toast";
import { formatTableValue } from "@/utils/format";
import { Menu, MenuButton, MenuItems } from "@headlessui/react";

type DonorOfferItemWithRequests = DonorOfferItem & {
  requests: (DonorOfferItemRequest & {
    partner: {
      name: string;
    };
  })[];
};

export default function AdminDynamicDonorOfferScreen() {
  const router = useRouter();
  const { donorOfferId } = useParams();

  const [items, setItems] = useState<DonorOfferItemWithRequests[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [donorOffer, setDonorOffer] = useState<DonorOffer>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/donorOffers/${donorOfferId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error();
        }

        const { donorOffer, itemsWithRequests } = await response.json();
        setItems(itemsWithRequests);
        setDonorOffer(donorOffer);
      } catch (e) {
        toast.error("Error fetching item requests", {
          position: "bottom-right",
        });
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [donorOfferId]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <>
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
                {formatTableValue(donorOffer?.offerName)}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold">
            {formatTableValue(donorOffer?.offerName)}:{" "}
            <span className="text-gray-primary text-opacity-70">
              {donorOffer?.state === DonorOfferState.UNFINALIZED
                ? "Partner Requests"
                : "General Items"}
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
            <div className="flex flex-row gap-3">
              {donorOffer?.state === DonorOfferState.UNFINALIZED ? (
                <>
                  <button
                    onClick={() => router.push("/donorOffers")}
                    className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-1 rounded-md font-medium hover:bg-red-50 transition"
                  >
                    <ShareFat size={18} weight="fill" />
                    Export Partner Requests
                  </button>
                  <button className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-1 rounded-md font-medium hover:bg-red-600 transition">
                    Save
                  </button>
                </>
              ) : (
                <button className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-1 rounded-md font-medium hover:bg-red-600 transition">
                  View All Unique Line Items
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-scroll">
            <table className="mt-4 min-w-full">
              <thead>
                <tr className="bg-blue-primary opacity-80 text-white border-b-2">
                  <th className="px-4 py-2 rounded-tl-lg text-left">
                    Item Name
                  </th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Expiration</th>
                  <th className="px-4 py-2 text-left">Unit Type</th>
                  <th className="px-4 py-2 text-left">Qty/Unit</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  {donorOffer?.state === DonorOfferState.UNFINALIZED ? (
                    <>
                      <th className="px-4 py-2 text-left">Request Summary</th>
                      <th className="px-4 py-2 rounded-tr-lg text-left">
                        Request Quantity
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 rounded-tr-lg w-12 text-left">
                        Manage
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr
                      data-odd={index % 2 !== 0}
                      className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors ${donorOffer?.state === DonorOfferState.FINALIZED ? "cursor-pointer data-[odd=true]:hover:bg-gray-100 hover:bg-gray-100" : ""}`}
                      onClick={() =>
                        donorOffer?.state === DonorOfferState.FINALIZED &&
                        router.push(
                          `/donorOffers/${donorOfferId}/itemRequests/${item.id}`,
                        )
                      }
                    >
                      <td className="px-4 py-2">
                        {formatTableValue(item.title)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.type)}
                      </td>
                      <td className="px-4 py-2">
                        {item.expirationDate
                          ? new Date(item.expirationDate).toLocaleDateString()
                          : "None"}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.unitType)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.quantityPerUnit)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.quantity)}
                      </td>
                      {donorOffer?.state === DonorOfferState.UNFINALIZED && (
                        <>
                          <td className="px-4 py-2">
                            {item.requests?.length > 0 ? (
                              <div>
                                Total -{" "}
                                {item.requests?.reduce(
                                  (sum, request) => sum + request.quantity,
                                  0,
                                )}
                                {item.requests?.map((request) => (
                                  <div key={request.id}>
                                    {request.partner.name} - {request.quantity}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="inline-block border-dashed border border-gray-primary rounded-md px-2 py-1 text-gray-primary opacity-20 text-sm font-semibold select-none">
                                No Requests
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        </>
                      )}
                      {donorOffer?.state !== DonorOfferState.UNFINALIZED && (
                        <td
                          className="px-4 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Menu as="div" className="float-right relative">
                            <MenuButton>
                              <DotsThree weight="bold" />
                            </MenuButton>
                            <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max"></MenuItems>
                          </Menu>
                        </td>
                      )}
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
