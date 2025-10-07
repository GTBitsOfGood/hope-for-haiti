"use client";

import { useState } from "react";
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
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import BaseTable, { tableConditional } from "@/components/baseTable/BaseTable";

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
  const [donorOffer, setDonorOffer] = useState<DonorOffer>();
  const [editing, setEditing] = useState(false);
  const [firstTime, setFirstTime] = useState(false);

  const { isLoading } = useFetch<{
    donorOffer: DonorOffer;
    itemsWithRequests: DonorOfferItemWithRequests[];
  }>(`/api/donorOffers/${donorOfferId}`, {
    cache: "no-store",
    onSuccess: (data) => {
      const { donorOffer, itemsWithRequests } = data;
      setItems(itemsWithRequests);
      setDonorOffer(donorOffer);

      if (
        (itemsWithRequests as DonorOfferItemWithRequests[]).some(
          (item) => item.requestQuantity === null
        )
      ) {
        setEditing(true);
        setFirstTime(true);
      } else {
        setEditing(false);
      }
    },
    onError: (error) => {
      toast.error("Error fetching item requests", {
        position: "bottom-right",
      });
      console.error("Fetch error:", error);
    },
  });

  const { apiClient } = useApiClient();

  const setRequestQuantity = (index: number, value: number) =>
    setItems((prev) => {
      const newVal = [...prev];
      newVal[index].requestQuantity = value;

      return newVal;
    });

  const handleSave = async () => {
    try {
      await apiClient.put(`/api/donorOffers/${donorOfferId}/requests`, {
        body: JSON.stringify({
          requests: items.map((item) => ({
            title: item.title,
            type: item.type,
            expirationDate: item.expirationDate,
            unitType: item.unitType,
            quantityPerUnit: item.quantityPerUnit,
            quantity: item.requestQuantity || 0,
          })),
        }),
      });
      setEditing(false);
      setFirstTime(false);
      toast.success("Request data saved successfully!");
    } catch {
      toast.error("Error saving request data");
    }
  };

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
                  <button className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-1 rounded-md font-medium hover:bg-red-50 transition">
                    <ShareFat size={18} weight="fill" />
                    Export Partner Requests
                  </button>
                  {editing ? (
                    <>
                      {!firstTime && (
                        <button
                          className="flex items-center gap-2 border border-red-500 text-red-600 bg-red-500 bg-opacity-25 px-4 py-1 rounded-md font-medium hover:bg-opacity-35 transition"
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-1 rounded-md font-medium hover:bg-red-600 transition"
                        onClick={handleSave}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <button
                      className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-1 rounded-md font-medium hover:bg-red-600 transition"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                  )}
                </>
              ) : (
                <button className="flex items-center gap-2 border border-red-500 text-white bg-red-500 px-4 py-1 rounded-md font-medium hover:bg-red-600 transition">
                  View All Unique Line Items
                </button>
              )}
            </div>
          </div>
          <BaseTable
            headers={[
              "Item Name",
              "Type",
              "Expiration",
              "Unit Type",
              "Qty/Unit",
              "Quantity",
              tableConditional(
                donorOffer?.state === DonorOfferState.UNFINALIZED,
                ["Request Summary", "Request Quantity"],
                ["Manage"]
              ),
            ]}
            rows={items.map((item) => ({
              cells: [
                item.title,
                item.type,
                item.expirationDate
                  ? new Date(item.expirationDate).toLocaleDateString()
                  : "None",
                item.unitType,
                item.quantityPerUnit,
                item.quantity,
                ...(donorOffer?.state === DonorOfferState.UNFINALIZED
                  ? [
                      item.requests?.length > 0 ? (
                        <div>
                          Total -{" "}
                          {item.requests?.reduce(
                            (sum, request) => sum + request.quantity,
                            0
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
                      ),
                      editing ? (
                        <input
                          type="number"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min={0}
                          value={item.requestQuantity || 0}
                          onChange={(e) =>
                            setRequestQuantity(
                              items.indexOf(item),
                              parseInt(e.currentTarget.value)
                            )
                          }
                        />
                      ) : (
                        <p>{item.requestQuantity}</p>
                      ),
                    ]
                  : [
                      <div onClick={(e) => e.stopPropagation()} key={1}>
                        <Menu as="div" className="float-right relative">
                          <MenuButton>
                            <DotsThree weight="bold" />
                          </MenuButton>
                          <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max"></MenuItems>
                        </Menu>
                      </div>,
                    ]),
              ],
              onClick:
                donorOffer?.state === DonorOfferState.FINALIZED
                  ? () => {
                      router.push(
                        `/donorOffers/${donorOfferId}/itemRequests/${item.id}`
                      );
                    }
                  : undefined,
            }))}
          />
        </>
      )}
    </>
  );
}
