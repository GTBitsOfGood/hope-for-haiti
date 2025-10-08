"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AddItemModal from "@/components/AddItemModal";
import BaseTable from "@/components/baseTable/BaseTable";

interface UnallocatedItemData {
  title: string;
  type: string;
  quantity: number;
  expirationDate: string | null;
  unitType: string;
  quantityPerUnit: number;
  requests: {
    partner: {
      name: string;
    };
    createdAt: string;
    quantity: number;
    priority: $Enums.RequestPriority | null;
    comments: string;
  }[];
}
import { useFetch } from "@/hooks/useFetch";
import { $Enums } from "@prisma/client";

enum ExpirationFilterKey {
  ALL = "All",
  ZERO_TO_THREE = "Expiring (0-3 Months)",
  THREE_TO_SIX = "Expiring (3-6 Months)",
  SIX_PLUS = "Expiring (6+ Months)",
}
const expirationFilterTabs = [
  ExpirationFilterKey.ALL,
  ExpirationFilterKey.ZERO_TO_THREE,
  ExpirationFilterKey.THREE_TO_SIX,
  ExpirationFilterKey.SIX_PLUS,
] as const;

function generateFetchUrl(filterKey: ExpirationFilterKey): string {
  let expirationDateBefore: string | null = null;
  let expirationDateAfter: string | null = null;
  const today = new Date();

  if (filterKey === ExpirationFilterKey.ZERO_TO_THREE) {
    expirationDateBefore = new Date(
      today.setMonth(today.getMonth() + 3)
    ).toISOString();
  } else if (filterKey === ExpirationFilterKey.THREE_TO_SIX) {
    expirationDateAfter = new Date(
      today.setMonth(today.getMonth() + 3)
    ).toISOString();
    expirationDateBefore = new Date(
      today.setMonth(today.getMonth() + 6)
    ).toISOString();
  } else if (filterKey === ExpirationFilterKey.SIX_PLUS) {
    expirationDateAfter = new Date(
      today.setMonth(today.getMonth() + 6)
    ).toISOString();
  }

  const url = new URL("/api/unallocatedItems", window.location.origin);
  if (expirationDateBefore)
    url.searchParams.set("expirationDateBefore", expirationDateBefore);
  if (expirationDateAfter)
    url.searchParams.set("expirationDateAfter", expirationDateAfter);

  return url.toString();
}

export default function AdminUnallocatedItemsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ExpirationFilterKey>(
    ExpirationFilterKey.ALL
  );

  const [addItemExpanded, setAddItemExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const [filteredItems, setFilteredItems] = useState<
    UnallocatedItemData[] | null
  >(null);

  const {
    isLoading,
    refetch: refetchItems,
    data,
  } = useFetch<{
    items: UnallocatedItemData[];
    unitTypes: string[];
    donorNames: string[];
    itemTypes: string[];
  }>("/api/generalItems/unallocated", {
    cache: "no-store",
    onError: (error) => {
      console.error("Error fetching unallocated items:", error);
      toast.error("Failed to fetch unallocated items");
    },
  });

  const items = filteredItems || data?.items || [];
  const unitTypes = data?.unitTypes || [];
  const donorNames = data?.donorNames || [];
  const itemTypes = data?.itemTypes || [];

  useEffect(() => {
    if (formSuccess) {
      refetchItems();
      setFilteredItems(null);
      setFormSuccess(false);
    }
  }, [formSuccess, refetchItems]);

  const filterItems = async (key: ExpirationFilterKey) => {
    setActiveTab(key);

    try {
      const response = await fetch(generateFetchUrl(key), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch filtered items");
      }

      const filterData = await response.json();
      setFilteredItems(filterData.items);
    } catch (error) {
      console.error("Filter fetch error:", error);
      toast.error("Failed to fetch items");
    }
  };

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
        <BaseTable
          headers={[
            "Title",
            "# of Requests",
            "Type",
            "Quantity",
            "Expiration",
            "Unit type",
            "Qty/Unit",
          ]}
          rows={items.map((item) => ({
            cells: [
              item.title,
              item.type,
              item.quantity,
              item.expirationDate
                ? new Date(item.expirationDate).toLocaleDateString()
                : "N/A",
              item.unitType,
              item.quantityPerUnit,
              item.requests.length,
            ],
            onClick: () => {
              router.push(
                `/unallocatedItems/requests?${new URLSearchParams({
                  title: item.title,
                  type: item.type,
                  unitType: item.unitType,
                  quantityPerUnit: item.quantityPerUnit.toString(),
                  ...(item.expirationDate
                    ? { expirationDate: item.expirationDate }
                    : {}),
                }).toString()}`
              );
            },
          }))}
        />
      )}
    </>
  );
}
