"use client";

import { useEffect, useState } from "react";
import { DotsThree, Eye, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { Item, UnallocatedItemRequest } from "@prisma/client";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AddItemModal from "@/components/AddItemModal";

import NewAllocationModal from "@/components/NewAllocationModal";

enum ExpirationFilterKey {
  ZERO_TO_THREE = "Expiring (0-3 Months)",
  THREE_TO_SIX = "Expiring (3-6 Months)",
  SIX_PLUS = "Expiring (6+ Months)",
}
const expirationFilterTabs = [
  ExpirationFilterKey.ZERO_TO_THREE,
  ExpirationFilterKey.THREE_TO_SIX,
  ExpirationFilterKey.SIX_PLUS,
] as const;

interface AllocationSearchResults {
  donorNames: string[];
  lotNumbers: number[];
  palletNumbers: number[];
  boxNumbers: number[];
}

export default function AdminUnallocatedItemsScreen() {
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(
    ExpirationFilterKey.ZERO_TO_THREE
  );
  const [isLoading, setIsLoading] = useState(true);
  const [manageIndex, setManageIndex] = useState(-1);

  const [viewingItemIndex, setViewingItemIndex] = useState<number | null>(null);
  const [showNewAllocationModal, setShowNewAllocationModal] = useState(false);

  const [allocationSearchResults, setAllocationSearchResults] =
    useState<AllocationSearchResults>({
      donorNames: [],
      lotNumbers: [],
      palletNumbers: [],
      boxNumbers: [],
    });

  const [addItemExpanded, setAddItemExpanded] = useState(false); // whether the 'add item' dropdown is expanded or not
  const [isModalOpen, setIsModalOpen] = useState(false); // whether the add item modal form is open or not

  const [unitTypes, setUnitTypes] = useState<string[]>([]); // All the unit types
  const [donorNames, setDonorNames] = useState<string[]>([]); // All the donor names
  const [itemTypes, setItemTypes] = useState<string[]>([]); // All the item types

  const [formSuccess, setFormSuccess] = useState(false); // whether the form was submitted successfully or not

  const dataFetch = React.useCallback(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/unallocatedItems");
        if (!res.ok) {
          throw new Error(`Error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setFilteredItems(data.items);

        setUnitTypes(data.unitTypes);
        setDonorNames(data.donorNames);
        setItemTypes(data.itemTypes);
      } catch (error) {
        toast.error("An error occurred while fetching data");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();

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
        setFilteredItems(itemsWithDates);
      } catch (error) {
        console.error("Error fetching unallocated items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  useEffect(dataFetch, [dataFetch]);

  useEffect(() => {
    if (formSuccess) {
      dataFetch();
    }
  }, [dataFetch, formSuccess]);

  const filterItems = async (key: ExpirationFilterKey) => {
    setActiveTab(key);
    setIsLoading(true);

    let expirationDateBefore: string | null = null;
    let expirationDateAfter: string | null = null;
    const today = new Date();

    if (key === ExpirationFilterKey.ZERO_TO_THREE) {
      expirationDateBefore = new Date(
        today.setMonth(today.getMonth() + 3)
      ).toISOString();
    } else if (key === ExpirationFilterKey.THREE_TO_SIX) {
      expirationDateAfter = new Date(
        today.setMonth(today.getMonth() + 3)
      ).toISOString();
      expirationDateBefore = new Date(
        today.setMonth(today.getMonth() + 6)
      ).toISOString();
    } else if (key === ExpirationFilterKey.SIX_PLUS) {
      expirationDateAfter = new Date(
        today.setMonth(today.getMonth() + 6)
      ).toISOString();
    }

    const url = new URL("/api/unallocatedItems", window.location.origin);
    if (expirationDateBefore)
      url.searchParams.append("expirationDateBefore", expirationDateBefore);
    if (expirationDateAfter)
      url.searchParams.append("expirationDateAfter", expirationDateAfter);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setFilteredItems(data.items); // Update UI with API data
    } catch (error) {
      toast.error("Failed to fetch items");
      console.error("Filter fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  async function handleOpenNewAllocationModal(item: Item) {
    console.log(
      "[AdminUnallocatedItemsScreen] handleOpenNewAllocationModal for item:",
      item
    );
    try {
      const query = new URLSearchParams({
        title: item.title,
        type: item.type,
        expiration: item.expirationDate?.toISOString() || "",
        unitSize: String(item.unitSize),
      }).toString();

      const url = "/api/allocations/itemSearch?" + query;
      console.log(
        "[AdminUnallocatedItemsScreen] Will fetch itemSearch at:",
        url
      );

      const res = await fetch(url);
      console.log(
        "[AdminUnallocatedItemsScreen] itemSearch status:",
        res.status
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch itemSearch: ${res.status}`);
      }

      const data = await res.json();
      console.log(
        "[AdminUnallocatedItemsScreen] Fetched itemSearch results:",
        data
      );
      setAllocationSearchResults(data);

      setShowNewAllocationModal(true);
    } catch (err) {
      console.error(
        "[AdminUnallocatedItemsScreen] handleOpenNewAllocationModal error:",
        err
      );
      alert("Failed to fetch search results. See console for details.");
    }
  }

  // if we're viewing a particular item ("Item Name": Partner Requests)
  if (viewingItemIndex !== null) {
    const item = filteredItems[viewingItemIndex] || null;
    if (!item) {
      setViewingItemIndex(null);
      return null;
    }

    return (
      <div className="p-4">
        <button
          onClick={() => setViewingItemIndex(null)}
          className="mb-4 text-blue-600 hover:underline"
        >
          &larr; Back to Unallocated Items
        </button>

        <div>
          <h2 className="text-xl font-bold mb-2">
            &quot;{item.title}&quot;: Partner Requests
          </h2>
          {/* Placeholder table */}
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Partner</th>
                <th className="px-4 py-2">Date requested</th>
                <th className="px-4 py-2">Requested quantity</th>
                <th className="px-4 py-2">Allocated quantity</th>
                <th className="px-4 py-2">Allocated summary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">Name</td>
                <td className="border px-4 py-2">12/12/2025</td>
                <td className="border px-4 py-2">10</td>
                <td className="border px-4 py-2">10</td>
                <td className="border px-4 py-2">4 - 23456, 2 - 23456</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4">
            <button
              className="border-2 border-dashed border-[#22070B]/40 text-sm text-[#22070B]/40 px-2 py-1 rounded-md"
              onClick={() => handleOpenNewAllocationModal(item)}
            >
              New Allocation
            </button>
          </div>

          {showNewAllocationModal && (
            <NewAllocationModal
              onClose={() => setShowNewAllocationModal(false)}
              unallocatedItemRequestId={String(item.id)}
              title={item.title}
              type={item.type}
              expiration={
                item.expirationDate ? item.expirationDate.toISOString() : ""
              }
              unitSize={String(item.unitSize)}
              searchResults={allocationSearchResults}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {isModalOpen ? (
        <AddItemModal
          setIsOpen={setIsModalOpen}
          unitTypes={unitTypes}
          donorNames={donorNames}
          itemTypes={itemTypes}
          formSuccess={setFormSuccess}
        />
      ) : null}
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
        {expirationFilterTabs.map((tab) => {
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
                <th className="px-4 py-2 text-left font-bold">Unit type</th>
                <th className="px-4 py-2 text-left font-bold">Qty/Unit</th>
                <th className="pl-4 py-2 text-left font-bold">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 border-b data-[odd=true]:hover:bg-gray-100 hover:bg-gray-100 cursor-pointer transition-colors`}
                    onClick={() => {
                      router.push(
                        `/unallocatedItems/requests?${new URLSearchParams({
                          title: item.title,
                          type: item.type,
                          expiration:
                            (item.expirationDate as unknown as string) || "",
                          unitSize: item.unitSize.toString(),
                          quantityPerUnit: item.quantityPerUnit
                            ? item.quantityPerUnit
                            : "",
                          unitType: item.unitType ? item.unitType : "",
                        }).toString()}`
                      );
                    }}
                  >
                    <td className="px-4 py-2 w-1/6">{item.title}</td>
                    <td className="px-4 py-2 w-1/6">{item.type}</td>
                    <td className="px-4 py-2 w-1/6">{item.quantity}</td>
                    <td className="px-4 py-2 w-1/6">
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2 w-1/6">{item.unitType}</td>
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
