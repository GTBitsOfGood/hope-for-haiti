"use client";

import React, { useEffect, useState } from "react";
import { Item } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ChatTeardropText,
  DotsThree,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { Tooltip } from "react-tooltip";
import { formatTableValue } from "@/utils/format";
import StatusTag from "@/components/StatusTag";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import EditUniqueLineItemModal from "@/components/UnallocatedItems/EditUniqueLineItem";

export default function UnallocatedItemsLineItemsScreen() {
  const searchParams = useSearchParams();

  const itemName = searchParams.get("title");
  const itemType = searchParams.get("type");
  const itemExpiration = searchParams.get("expirationDate");
  const unitType = searchParams.get("unitType");
  const quantityPerUnit = searchParams.get("quantityPerUnit");

  const [requests, setRequests] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/unallocatedItems/lineItems?${new URLSearchParams({
            title: itemName as string,
            type: itemType as string,
            unitType: unitType as string,
            quantityPerUnit: quantityPerUnit as string,
            ...(itemExpiration ? { expirationDate: itemExpiration } : {}),
          })}`
        );

        if (!response.ok) {
          throw new Error();
        }

        const data = (await response.json()).items;
        setRequests(data);
      } catch (e) {
        toast.error("Error fetching unallocated items", {
          position: "bottom-right",
        });
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [itemName, itemType, itemExpiration, unitType, quantityPerUnit]);

  return (
    <>
      <EditUniqueLineItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      <div className="flex items-center justify-between gap-1 mb-4">
        <div className="flex row">
          <Link
            href="/unallocatedItems"
            className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
          >
            Unallocated Items
          </Link>
          <span className="text-gray-500 text-sm flex items-center pl-2 pr-2">
            /{" "}
          </span>
          <span className="font-medium bg-gray-100 transition-colors rounded flex items-center justify-center p-1">
            Unique Line Items
          </span>
        </div>
        <Link href="/unallocatedItems">
          <button className="flex items-center border gap-2 text-center text-red-500 border-red-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition">
            Back to Unallocated Items
          </button>
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">{itemName}: Unique Line Items</h1>
      <h2 className="text-xl font-light text-gray-500 pt-4 pb-4">
        A list of all the unique items for this item.
      </h2>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <div className="overflow-x-scroll pb-2">
          <table className="mt-4 min-w-full">
            <thead>
              <tr className="bg-blue-primary opacity-80 text-white font-bold border-b-2">
                <th className="px-4 py-2 min-w-32 rounded-tl-lg text-left">
                  Quantity
                </th>
                <th className="px-4 py-2 min-w-32 text-left">
                  Qty Avail/Total
                </th>
                <th className="px-4 py-2 min-w-32 text-left">Donor name</th>
                <th className="px-4 py-2 min-w-32 text-left">Pallet</th>
                <th className="px-4 py-2 min-w-32 text-left">Box number</th>
                <th className="px-4 py-2 min-w-32 text-left">Lot number</th>
                <th className="px-4 py-2 min-w-32 text-left">Unit price</th>
                <th className="px-4 py-2 text-left">Comment</th>
                <th className="px-4 py-2 min-w-32 text-left">
                  Donor Shipping #
                </th>
                <th className="px-4 py-2 min-w-32 text-left">HfH Shipping #</th>
                <th className="px-4 py-2 min-w-32 text-left">Max Limit</th>
                <th className="px-4 py-2 min-w-32 text-left">Visibility</th>
                <th className="px-4 py-2 min-w-32 text-left">Allocation</th>
                <th className="px-4 py-2 min-w-32 text-left">GIK</th>
                <th className="px-4 py-2 rounded-tr-lg text-left w-12">
                  Manage
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className="bg-white data-[odd=true]:bg-gray-50 border-b transition-colors"
                  >
                    <td className="px-4 py-2">
                      {formatTableValue(item.quantity)}
                    </td>
                    <td className="px-4 py-2">{/* TODO */}-</td>
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
                    <td className="px-4 py-2">
                      <Menu as="div" className="relative float-right">
                        <MenuButton>
                          <DotsThree weight="bold" />
                        </MenuButton>
                        <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
                          <MenuItem
                            as="button"
                            className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <PencilSimple
                              className="inline-block mr-2"
                              size={22}
                            />
                            Edit item details
                          </MenuItem>

                          <MenuItem
                            as="button"
                            className="flex w-full px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                            onClick={async () => {
                              const confirmed = confirm(
                                //TODO: Delete graphic
                                `Are you sure you want to delete this item?`
                              );
                              if (!confirmed) return;
                              const res = await fetch(
                                `/api/unallocatedItems/${item.id}`,
                                { method: "DELETE" }
                              );
                              if (!res.ok) {
                                toast.error("Failed to delete item");
                                return;
                              }
                              toast.success("Item deleted successfully!");
                              setRequests((prev) =>
                                prev.filter((req) => req.id !== item.id)
                              );
                            }}
                          >
                            <TrashSimple
                              className="inline-block mr-2"
                              size={22}
                            />
                            Delete item
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
