"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import ModalDropDown from "@/components/ModalDropDown";
import { RequestPriority } from "@prisma/client";
import ModalTextField from "@/components/ModalTextField";
import toast from "react-hot-toast";

const priorityOptions = [
  {
    value: RequestPriority.LOW,
    label: "Low",
  },
  {
    value: RequestPriority.MEDIUM,
    label: "Medium",
  },
  {
    value: RequestPriority.HIGH,
    label: "High",
  },
];

interface GeneralItem {
  title: string;
  type: string;
  expirationDate: string;
  unitType: string;
  quantityPerUnit: string;
  quantity: number;
}

enum ExpirationFilterKey {
  ALL = "All",
  ZERO_TO_THREE = "Expiring (0-3 Months)",
  THREE_TO_SIX = "Expiring (3-6 Months)",
  SIX_PLUS = "Expiring (6+ Months)",
}

function withinMonths(item: GeneralItem, months: number) {
  if (!item.expirationDate) return false;
  const now = new Date();
  const limit = new Date();
  const expirationDate = new Date(item.expirationDate);
  limit.setMonth(now.getMonth() + months);
  return expirationDate >= now && expirationDate <= limit;
}

const expirationFilterMap: Record<
  ExpirationFilterKey,
  (item: GeneralItem) => boolean
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

interface RequestData {
  priority: RequestPriority | null;
  quantity: number;
  comments: string;
}

function RequestItemsModal({
  onClose,
  items,
}: {
  onClose: (clear?: boolean) => void;
  items: GeneralItem[];
}) {
  const [formData, setFormData] = useState<RequestData[]>(
    items.map(() => ({ priority: null, quantity: 0, comments: "" }))
  );
  const updateItemAtIndex = (index: number, updates: object) => {
    setFormData((formData) => {
      const fd = [...formData];

      fd[index] = { ...fd[index], ...updates };

      return fd;
    });
  };

  const handleSubmit = () => {
    for (let i = 0; i < formData.length; i++) {
      const row = formData[i];
      const itemStr = `${items[i].title} (${items[i].expirationDate})`;

      if (!row.priority) return toast.error(`Must set priority for ${itemStr}`);
      if (row.quantity < 1)
        return toast.error(`Must request at least one of ${itemStr}`);
    }

    (async () => {
      const resp = await fetch("/api/unallocatedItemRequest", {
        method: "POST",
        body: JSON.stringify(
          items.map((item, i) => ({ generalItem: item, ...formData[i] }))
        ),
      });

      if (resp.ok) {
        toast.success("Request submitted");
        onClose(true);
      } else {
        toast.error("An error occurred");
      }
    })();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[700px] relative max-h-[90vh] text-gray-primary">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Request items</h2>
          <X
            onClick={() => onClose(false)}
            size={24}
            className="cursor-pointer"
          />
        </div>
        <table>
          <thead>
            <tr>
              <th className="px-2 text-left font-medium">Item</th>
              <th className="px-2 text-left font-medium">Expiration</th>
              <th className="px-2 text-left font-medium">Priority</th>
              <th className="px-2 text-left font-medium">Quantity</th>
              <th className="px-2 text-left font-medium">Comment</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={JSON.stringify(item)}>
                <td className="px-2">{item.title}</td>
                <td className="px-2">{item.expirationDate}</td>
                <td className="px-2">
                  <div className="w-32">
                    <ModalDropDown
                      name="priority"
                      options={priorityOptions}
                      placeholder="Priority"
                      required
                      onSelect={(value: string) => {
                        updateItemAtIndex(i, { priority: value });
                      }}
                    />
                  </div>
                </td>
                <td className="px-2">
                  <div className="w-32">
                    <ModalTextField
                      name="quantity"
                      placeholder="Quantity"
                      type="number"
                      required
                      inputProps={{
                        defaultValue: 0,
                        min: 0,
                        onChange: (e: { target: { value: string } }) => {
                          updateItemAtIndex(i, { quantity: e.target.value });
                        },
                      }}
                    />
                  </div>
                </td>
                <td className="px-2">
                  <ModalTextField
                    name="comments"
                    placeholder="Comments"
                    required
                    inputProps={{
                      onChange: (e: { target: { value: string } }) => {
                        updateItemAtIndex(i, { comments: e.target.value });
                      },
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex space-x-4">
          <button
            className="block grow border border-red-500 text-center text-red-500 bg-white py-1 px-4 rounded font-medium hover:bg-red-50 transition"
            onClick={() => onClose(false)}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="block grow bg-red-500 text-center text-white py-1 px-4 rounded font-medium hover:bg-red-600 transition"
          >
            Add item
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnallocatedItems() {
  const [activeTab, setActiveTab] = useState<string>("All"); //this is for the row of tabs for table filtering
  const [items, setItems] = useState<GeneralItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GeneralItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedItems, setSelectedItems] = useState<GeneralItem[]>([]);
  const addToSelectedItems = (item: GeneralItem) =>
    setSelectedItems((prev) => [...prev, item]);
  const removeFromSelectedItems = (item: GeneralItem) =>
    setSelectedItems((prev) => prev.filter((otherItem) => otherItem !== item));

  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    setSelectedItems((prev) =>
      prev.filter((item) => filteredItems.includes(item))
    );
  }, [activeTab, filteredItems]);

  useEffect(() => {
    setTimeout(async () => {
      const response = await fetch("api/unallocatedItems", {
        method: "GET",
        cache: "no-store",
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
          <button
            className="flex items-center gap-2 border border-red-500 text-red-500 bg-white disabled:bg-gray-primary disabled:border-none disabled:opacity-10 disabled:text-white px-4 py-2 rounded-lg font-medium hover:opacity-15 transition"
            disabled={selectedItems.length === 0}
            onClick={() => setRequestModalOpen(true)}
          >
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
                <th className="px-4 py-2 text-left font-bold">Unit type</th>
                <th className="px-4 py-2 text-left font-bold">Qty/Unit</th>
                <th className="pl-4 py-2 text-left font-bold">Request</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <React.Fragment key={JSON.stringify(item)}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
                  >
                    <td className="px-4 py-2">
                      <input
                        className="rounded bg-gray-primary bg-opacity-[0.025] border-gray-primary border-opacity-10"
                        type="checkbox"
                        name={`item-${index}`}
                        checked={selectedItems.includes(item)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addToSelectedItems(item);
                          } else {
                            removeFromSelectedItems(item);
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                    <td className="px-4 py-2">
                      {item.expirationDate || "N/A"}
                    </td>
                    <td className="px-4 py-2">{item.unitType}</td>
                    <td className="px-4 py-2">{item.quantityPerUnit}</td>
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

      {requestModalOpen && (
        <RequestItemsModal
          items={selectedItems}
          onClose={(clear?: boolean) => {
            if (clear) setSelectedItems([]);
            setRequestModalOpen(false);
          }}
        />
      )}
    </>
  );
}
