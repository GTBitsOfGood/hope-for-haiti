"use client";

import { useCallback, useEffect, useState } from "react";
import { DotsThree, Eye, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import { formatTableValue } from "@/utils/format";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AddItemModal from "@/components/AddItemModal";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { QuantizedGeneralItemStringDate } from "@/types";

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
  const [items, setItems] = useState<QuantizedGeneralItemStringDate[]>([]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ExpirationFilterKey>(
    ExpirationFilterKey.ALL
  );
  const [isLoading, setIsLoading] = useState(true);

  const [addItemExpanded, setAddItemExpanded] = useState(false); // whether the 'add item' dropdown is expanded or not
  const [isModalOpen, setIsModalOpen] = useState(false); // whether the add item modal form is open or not

  const [unitTypes, setUnitTypes] = useState<string[]>([]); // All the unit types
  const [donorNames, setDonorNames] = useState<string[]>([]); // All the donor names
  const [itemTypes, setItemTypes] = useState<string[]>([]); // All the item types

  const [formSuccess, setFormSuccess] = useState(false); // whether the form was submitted successfully or not

  const fetchData = useCallback(() => {
    (async () => {
      try {
        const response = await fetch(generateFetchUrl(activeTab));
        if (!response.ok) {
          throw new Error("Failed to fetch unallocated items");
        }

        const data = await response.json();

        setItems(data.items);
        setUnitTypes(data.unitTypes);
        setDonorNames(data.donorNames);
        setItemTypes(data.itemTypes);
      } catch (error) {
        console.error("Error fetching unallocated items:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [activeTab]);

  useEffect(fetchData, [fetchData, formSuccess]);

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
      url.searchParams.set("expirationDateBefore", expirationDateBefore);
    if (expirationDateAfter)
      url.searchParams.set("expirationDateAfter", expirationDateAfter);
    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setItems(data.items); // Update UI with API data
    } catch (error) {
      toast.error("Failed to fetch items");
      console.error("Filter fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* The lists are added for the drop downs */}
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
        <div>
          <table className="mt-4 min-w-full">
            <thead>
              <tr className="opacity-80 text-white font-bold border-b-2 bg-blue-primary">
                <th className="px-4 py-2 text-left rounded-tl-lg">Title</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Expiration</th>
                <th className="px-4 py-2 text-left">Unit type</th>
                <th className="px-4 py-2 text-left">Qty/Unit</th>
                <th className="px-4 py-2 text-left rounded-tr-lg w-12">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 border-b data-[odd=true]:hover:bg-gray-100 hover:bg-gray-100 cursor-pointer transition-colors`}
                    onClick={() => {
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
                    }}
                  >
                    <td className="px-4 py-2">
                      {formatTableValue(item.title)}
                    </td>
                    <td className="px-4 py-2">{formatTableValue(item.type)}</td>
                    <td className="px-4 py-2">
                      {formatTableValue(item.quantity)}
                    </td>
                    <td className="px-4 py-2">
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      {formatTableValue(item.unitType)}
                    </td>
                    <td className="px-4 py-2">
                      {formatTableValue(item.quantityPerUnit)}
                    </td>
                    <td
                      className="px-4 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Menu as="div" className="float-right relative">
                        <MenuButton>
                          <DotsThree weight="bold" />
                        </MenuButton>
                        <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
                          <MenuItem
                            as="button"
                            className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              router.push(
                                `/unallocatedItems/lineItems?${new URLSearchParams(
                                  {
                                    title: item.title,
                                    type: item.type,
                                    unitType: item.unitType,
                                    quantityPerUnit:
                                      item.quantityPerUnit.toString(),
                                    ...(item.expirationDate
                                      ? { expirationDate: item.expirationDate }
                                      : {}),
                                  }
                                ).toString()}`
                              );
                            }}
                          >
                            <Eye className="inline-block mr-2" size={22} />
                            View unique items
                          </MenuItem>
                        </MenuItems>
                      </Menu>
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
