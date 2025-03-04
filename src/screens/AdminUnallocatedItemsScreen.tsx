"use client";

import { useEffect, useState } from "react";
import { DotsThree, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { UnallocatedItemRequest } from "@prisma/client";
import React from "react";
import Link from "next/link";

enum ExpirationFilterKey {
  ALL = "All",
  ZERO_TO_THREE = "0-3 Months",
  THREE_TO_SIX = "3-6 Months",
  SIX_PLUS = "6+ Months",
}

function withinMonths(item: UnallocatedItemRequest, months: number) {
  if (!item.expirationDate) return false;
  const now = new Date();
  const date = new Date(item.expirationDate);
  date.setMonth(now.getMonth() + months);
  return item.expirationDate >= now && item.expirationDate <= date;
}

const expirationFilterMap: Record<
  ExpirationFilterKey,
  (item: UnallocatedItemRequest) => boolean
> = {
  [ExpirationFilterKey.ALL]: () => true,
  [ExpirationFilterKey.ZERO_TO_THREE]: (item) => withinMonths(item, 3),
  [ExpirationFilterKey.THREE_TO_SIX]: (item) =>
    !withinMonths(item, 3) && withinMonths(item, 6),
  [ExpirationFilterKey.SIX_PLUS]: (item) => {
    const hasExpiration = Boolean(item.expirationDate);
    return hasExpiration && !withinMonths(item, 6);
  },
};

type PartnerRequest = {
  partner: string;
  dateRequested: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  allocatedSummary: string;
};

export default function AdminUnallocatedItemsScreen() {
  const [items, setItems] = useState<UnallocatedItemRequest[]>([]);
  const [filteredItems, setFilteredItems] = useState<UnallocatedItemRequest[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);
  const [loadingIndices, setLoadingIndices] = useState<number[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<
    Record<number, PartnerRequest[]>
  >({});

  useEffect(() => {
    setTimeout(() => {
      const dummyData: UnallocatedItemRequest[] = [
        {
          id: 1,
          title: "Canned Soup",
          category: "Type",
          quantity: 24,
          unitSize: 1,
          comments: "Comments",
          partnerId: 1,
          expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
        {
          id: 2,
          title: "Rice",
          category: "Type",
          quantity: 50,
          unitSize: 1,
          comments: "White rice, 1lb bags",
          partnerId: 1,
          expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120),
        },
        {
          id: 3,
          title: "Pasta",
          category: "Type",
          quantity: 100,
          unitSize: 1,
          comments: "Spaghetti, 1lb boxes",
          partnerId: 1,
          expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
        },
        {
          id: 4,
          title: "Canned Beans",
          category: "Type",
          quantity: 36,
          unitSize: 1,
          comments: "Black beans and pinto beans",
          partnerId: 1,
          expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 240),
        },
        {
          id: 5,
          title: "Cereal",
          category: "Type",
          quantity: 20,
          unitSize: 1,
          comments: "Various types, family size boxes",
          partnerId: 1,
          expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        },
      ];

      setItems(dummyData);
      setFilteredItems(dummyData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filterItems = (key: ExpirationFilterKey) => {
    setActiveTab(key);
    setFilteredItems(items.filter(expirationFilterMap[key]));
    setExpandedIndices([]);
    setLoadingIndices([]);
  };

  const toggleExpand = async (index: number) => {
    if (expandedIndices.includes(index)) {
      setExpandedIndices(expandedIndices.filter((i) => i !== index));
    } else {
      setExpandedIndices([...expandedIndices, index]);
      if (!partnerRequests[index]) {
        setLoadingIndices([...loadingIndices, index]);
        const requests = await getPartnerRequests();
        setPartnerRequests((prev) => ({
          ...prev,
          [index]: requests as PartnerRequest[],
        }));
        setLoadingIndices((prev) => prev.filter((i) => i !== index));
      }
    }
  };

  const getPartnerRequests = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            partner: "Partner A",
            dateRequested: "12/12/2025",
            requestedQuantity: 10,
            allocatedQuantity: 10,
            allocatedSummary: "4 - 23456, 2 - 23456",
          },
        ]);
      }, 100);
    });
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Unallocated Items</h1>
      <div className="flex justify-between items-center w-full py-4">
        <div className="relative w-1/3">
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
        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition">
            <Plus size={18} /> Filter
          </button>
          <Link href="/bulk_add_items">
            <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition">
              <Plus size={18} /> Add Item
            </button>
          </Link>
        </div>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2">
        {Object.keys(expirationFilterMap).map((tab) => {
          const key = tab as ExpirationFilterKey;

          return (
            <button
              key={tab}
              data-active={activeTab === tab}
              className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-500"
              onClick={() => filterItems(key)}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <div className="overflow-x-scroll">
          <table className="mt-4 rounded-t-lg overflow-hidden min-w-full">
            <thead>
              <tr className="bg-blue-primary opacity-80 text-white border-b-2">
                <th className="px-4 py-2 text-left font-bold"></th>
                <th className="px-4 py-2 text-left font-bold">Title</th>
                <th className="px-4 py-2 text-left font-bold">Type</th>
                <th className="px-4 py-2 text-left font-bold">Quantity</th>
                <th className="px-4 py-2 text-left font-bold">Expiration</th>
                <th className="px-4 py-2 text-left font-bold">Unit size</th>
                <th className="pl-4 py-2 text-left font-bold">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 ${expandedIndices.includes(index) ? "" : "border-b"}`}
                  >
                    <td className="px-4 py-2 w-1/12">
                      <button
                        onClick={() => toggleExpand(index)}
                        className="focus:outline-none"
                      >
                        {expandedIndices.includes(index) ? "▼" : "▶"}
                      </button>
                    </td>
                    <td className="px-4 py-2 w-1/6">{item.title}</td>
                    <td className="px-4 py-2 w-1/6">{item.category}</td>
                    <td className="px-4 py-2 w-1/6">{item.quantity}</td>
                    <td className="px-4 py-2 w-1/6">
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2 w-1/6">{item.unitSize}</td>
                    <td className="px-4 py-2">
                      <div className="float-right">
                        <DotsThree
                          weight="bold"
                          className="cursor-pointer"
                          onClick={() => {}}
                        />
                      </div>
                    </td>
                  </tr>
                  {expandedIndices.includes(index) && (
                    <tr className="border-b">
                      <td colSpan={7}>
                        <div className="py-4 px-8">
                          <h2 className="font-semibold">Partner Requests</h2>
                          {loadingIndices.includes(index) ? (
                            <div className="flex justify-center items-center mt-4">
                              <CgSpinner className="w-8 h-8 animate-spin opacity-50" />
                            </div>
                          ) : (
                            <table className="rounded-t-lg min-w-full mt-2">
                              <thead>
                                <tr className="bg-blue-primary text-blue-primary bg-opacity-5">
                                  <th className="px-4 py-2 text-left font-normal">
                                    Partner
                                  </th>
                                  <th className="px-4 py-2 text-left font-normal">
                                    Date requested
                                  </th>
                                  <th className="px-4 py-2 text-left font-normal">
                                    Requested quantity
                                  </th>
                                  <th className="px-4 py-2 text-left font-normal">
                                    Allocated quantity
                                  </th>
                                  <th className="px-4 py-2 text-left font-normal">
                                    Allocated summary (lot, pallet, box)
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {partnerRequests[index]?.map(
                                  (
                                    request: PartnerRequest,
                                    reqIndex: number
                                  ) => (
                                    <tr key={reqIndex}>
                                      <td className="px-4 py-2">
                                        {request.partner}
                                      </td>
                                      <td className="px-4 py-2">
                                        {request.dateRequested}
                                      </td>
                                      <td className="px-4 py-2">
                                        {request.requestedQuantity}
                                      </td>
                                      <td className="px-4 py-2">
                                        {request.allocatedQuantity}
                                      </td>
                                      <td className="px-4 py-2">
                                        {request.allocatedSummary}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
