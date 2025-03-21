"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { Item } from "@prisma/client";
import React from "react";

enum ExpirationFilterKey {
  ALL = "All",
  ZERO_TO_THREE = "Expiring (0-3 Months)",
  THREE_TO_SIX = "Expiring (3-6 Months)",
  SIX_PLUS = "Expiring (6+ Months)",
}

enum UnallocatedItemsTab {
  UNALLOCATED_ITEMS = "Unallocated Items",
  MY_REQUESTS = "My Requests",
}

function withinMonths(item: Item, months: number) {
  if (!item.expirationDate) return false;
  const now = new Date();
  const limit = new Date();
  const expirationDate = new Date(item.expirationDate);
  limit.setMonth(now.getMonth() + months);
  return expirationDate >= now && expirationDate <= limit;
}

const expirationFilterMap: Record<
  ExpirationFilterKey,
  (item: Item) => boolean
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

export default function PartnerUnallocatedItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [activeItemTab, setActiveItemTab] =
    useState<string>("Unallocated Items"); //this is for the upper row of tabs
  const [activeTab, setActiveTab] = useState<string>("All"); //this is for the row of tabs for table filtering
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(async () => {
      const response = await fetch("api/unallocatedItems", {
        method: "GET",
      });
      const data = await response.json();
      setItems(data.items);
      setFilteredItems(data.items);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filterItems = (key: ExpirationFilterKey) => {
    setActiveTab(key);
    setFilteredItems(items.filter(expirationFilterMap[key]));
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-primary">
        Unallocated Items
      </h1>

      <div className="flex space-x-4 mt-4 border-b-2 border-gray-primary border-opacity-10">
        {Object.values(UnallocatedItemsTab).map((tab) => {
          return (
            <button
              key={tab}
              data-active={activeItemTab === tab}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
              onClick={() => {
                setActiveItemTab(tab);
              }} // !! TODO: Implement tab switching when My Requests screen is implemented !!
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center w-full py-4 mt-3">
        <div className="relative w-1/3">
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
          <button className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition">
            <Plus size={18} /> Filter
          </button>
          <button className="flex items-center gap-2 bg-gray-primary opacity-10 text-white px-4 py-2 rounded-lg font-medium hover:opacity-15 transition">
            <Plus size={18} /> Request items
          </button>
        </div>
      </div>
      <div className="flex space-x-4 mt-4 border-b-2 border-gray-primary border-opacity-10">
        {Object.keys(expirationFilterMap).map((tab) => {
          const key = tab as ExpirationFilterKey;
          return (
            <button
              key={tab}
              data-active={activeTab === tab}
              className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
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
          <table className="mt-4 rounded-t-lg overflow-hidden table-fixed w-full">
            <thead>
              <tr className="bg-gray-primary bg-opacity-5 text-gray-primary text-opacity-70 border-b-2 break-words">
                <th className="px-4 py-2 w-[48px]"></th>
                <th className="px-4 py-2 text-left font-bold">Title</th>
                <th className="px-4 py-2 text-left font-bold">Type</th>
                <th className="px-4 py-2 text-left font-bold">Quantity</th>
                <th className="px-4 py-2 text-left font-bold">Expiration</th>
                <th className="px-4 py-2 text-left font-bold">Unit size</th>
                <th className="pl-4 py-2 text-left font-bold">Request</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
                  >
                    <td className="px-4 py-2">
                      <input
                        className="rounded bg-gray-primary bg-opacity-[0.025] border-gray-primary border-opacity-10"
                        type="checkbox"
                        name={`item-${index}`}
                      />
                    </td>
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                    <td className="px-4 py-2">
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      {item.unitSize.toString() + item.unitType}
                    </td>
                    <td className="px-4 py-2">
                      {false ? ( // !! TODO: Make this conditional based on item requested status !!
                        <div className="px-2 py-0.5 inline-block rounded bg-amber-primary bg-opacity-20 text-gray-primary">
                          Requested
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 inline-block rounded bg-gray-primary bg-opacity-5 text-gray-primary">
                          None
                        </div>
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
