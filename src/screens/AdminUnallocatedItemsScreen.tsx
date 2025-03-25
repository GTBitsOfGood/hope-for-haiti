"use client";

import { useEffect, useState } from "react";
import { DotsThree, Eye, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { UnallocatedItemRequest } from "@prisma/client";
import React from "react";
import { useRouter } from "next/navigation";
import AddItemModal from "@/components/AddItemModal";

enum ExpirationFilterKey {
  ALL = "All",
  ZERO_TO_THREE = "Expiring (0-3 Months)",
  THREE_TO_SIX = "Expiring (3-6 Months)",
  SIX_PLUS = "Expiring (6+ Months)",
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

export default function AdminUnallocatedItemsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<UnallocatedItemRequest[]>([]);
  const [filteredItems, setFilteredItems] = useState<UnallocatedItemRequest[]>(
    []
  );
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [manageIndex, setManageIndex] = useState(-1);

  const [addItemExpanded, setAddItemExpanded] = useState(false); // whether the 'add item' dropdown is expanded or not
  const [isModalOpen, setIsModalOpen] = useState(false); // whether the add item modal form is open or not
  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        // arbitarily late end date
        const tenYearsFromNow = new Date();
        tenYearsFromNow.setFullYear(now.getFullYear() + 10);

        const response = await fetch(
          `/api/unallocatedItems?expirationDateAfter`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch unallocated items");
        }

        const data = await response.json();
        const itemsWithDates = data.items.map(
          (item: UnallocatedItemRequest) => ({
            ...item,
            expirationDate: item.expirationDate
              ? new Date(item.expirationDate)
              : null,
          })
        );
        setItems(itemsWithDates);
        setFilteredItems(itemsWithDates);
      } catch (error) {
        console.error("Error fetching unallocated items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterItems = (key: ExpirationFilterKey) => {
    setActiveTab(key);
    setFilteredItems(items.filter(expirationFilterMap[key]));
  };

  return (
    <>
      {isModalOpen ? <AddItemModal setIsOpen={setIsModalOpen} /> : null}
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
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
              onClick={() => {
                setAddItemExpanded(!addItemExpanded);
              }}
            >
              <Plus size={18} /> Add Item
            </button>
            {addItemExpanded ? (
              <div className="flex flex-col gap-y-1 items-center absolute left-0 mt-2 p-1 origin-top-right bg-white border border-solid border-gray-primary rounded border-opacity-10">
                <button
                  className="block font-medium w-full rounded text-gray-primary text-opacity-70 text-center px-2 py-1 hover:bg-gray-primary hover:bg-opacity-5"
                  onClick={() => {
                    setIsModalOpen(true);
                    setAddItemExpanded(false);
                  }}
                >
                  Single item
                </button>
                <button
                  className="block font-medium w-full rounded text-gray-primary text-opacity-70 text-center px-2 py-1 hover:bg-gray-primary hover:bg-opacity-5"
                  onClick={() => router.push("/bulkAddItems")}
                >
                  Bulk items
                </button>
              </div>
            ) : null}
          </div>
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
                    className={`bg-white data-[odd=true]:bg-gray-50 border-b data-[odd=true]:hover:bg-gray-100 hover:bg-gray-100 cursor-pointer transition-colors`}
                    onClick={() =>
                      router.push(
                        `/unallocatedItems/requests?${new URLSearchParams({
                          title: item.title,
                          type: item.type,
                          expiration: item.expirationDate?.toISOString() || "",
                          unitSize: item.unitSize.toString(),
                        }).toString()}`
                      )
                    }
                  >
                    <td className="px-4 py-2 w-1/6">{item.title}</td>
                    <td className="px-4 py-2 w-1/6">{item.type}</td>
                    <td className="px-4 py-2 w-1/6">{item.quantity}</td>
                    <td className="px-4 py-2 w-1/6">
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2 w-1/6">{item.unitSize}</td>
                    <td
                      className="px-4 py-2 w-1/12"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="float-right relative">
                        <DotsThree
                          weight="bold"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManageIndex(manageIndex === index ? -1 : index);
                          }}
                        />
                        {manageIndex === index && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setManageIndex(-1)}
                            />
                            <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                              <div className="py-1">
                                <button
                                  className="block w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <Eye
                                    className="inline-block mr-2"
                                    size={22}
                                  />
                                  View unique items
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
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
