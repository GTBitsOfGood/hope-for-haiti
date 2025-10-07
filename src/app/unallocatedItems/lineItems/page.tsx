"use client";

import React, { useState } from "react";
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
import StatusTag from "@/components/tags/StatusTag";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import EditUniqueLineItemModal from "@/components/UnallocatedItems/EditUniqueLineItem";
import { useFetch } from "@/hooks/useFetch";
import BaseTable, { extendTableHeader } from "@/components/baseTable/BaseTable";

export default function UnallocatedItemsLineItemsPage() {
  const searchParams = useSearchParams();

  const itemParams = {
    title: searchParams.get("title") || "",
    type: searchParams.get("type") || "",
    unitType: searchParams.get("unitType") || "",
    quantityPerUnit: searchParams.get("quantityPerUnit") || "",
    ...(searchParams.get("expirationDate") && {
      expirationDate: searchParams.get("expirationDate"),
    }),
  };

  const itemParamsForUrl = Object.fromEntries(
    Object.entries(itemParams).filter(
      ([, value]) => value !== null && value !== undefined
    )
  ) as Record<string, string>;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data, isLoading, refetch } = useFetch<{ items: Item[] }>(
    `/api/unallocatedItems/lineItems?${new URLSearchParams(itemParamsForUrl).toString()}`,
    {
      onError: (error) => {
        toast.error("Error fetching unallocated items", {
          position: "bottom-right",
        });
        console.error("Fetch error:", error);
      },
    }
  );

  const items = data?.items || [];

  const handleDeleteItem = async (item: Item) => {
    const confirmed = confirm(`Are you sure you want to delete this item?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/unallocatedItems/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete item");
        return;
      }

      toast.success("Item deleted successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete item");
      console.error("Delete error:", error);
    }
  };

  const handleEditItem = () => {
    setIsEditModalOpen(true);
  };

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
      <h1 className="text-2xl font-semibold">{itemParams.title}: Unique Line Items</h1>
      
      <div className="flex space-x-4 mt-4 border-b-2">
        <Link
          href={`/unallocatedItems/requests?${new URLSearchParams(itemParamsForUrl).toString()}`}
          className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none text-gray-500 hover:text-black"
        >
          <div className="hover:bg-gray-100 px-2 py-1 rounded">Partner Requests</div>
        </Link>
        <button
          className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none border-b-2 border-black bottom-[-1px]"
        >
          <div className="hover:bg-gray-100 px-2 py-1 rounded">Unique Line Items</div>
        </button>
      </div>
      
      <h2 className="text-xl font-light text-gray-500 pt-4 pb-4">
        A list of all the unique items for this item.
      </h2>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <BaseTable
          headers={[
            "Quantity",
            "Qty Avail/Total",
            "Donor name",
            "Pallet",
            "Box number",
            "Lot number",
            "Unit price",
            "Comment",
            "Donor Shipping #",
            "HfH Shipping #",
            "Max Limit",
            "Visibility",
            "Allocation",
            "GIK",
            extendTableHeader("Manage", "w-12"),
          ]}
          rows={items.map((item) => ({
            cells: [
              item.quantity,
              /* TODO */ "-",
              item.donorName,
              item.palletNumber,
              item.boxNumber,
              item.lotNumber,
              item.unitPrice.toString(),
              <div key="itemNotes">
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
              </div>,
              item.donorShippingNumber,
              item.hfhShippingNumber,
              item.maxRequestLimit,
              <StatusTag
                value={item.visible}
                trueText="Visible"
                falseText="Disabled"
                key="visible"
              />,
              <StatusTag
                value={item.allowAllocations}
                trueText="Allowed"
                falseText="Disabled"
                key="allowAllocations"
              />,
              <StatusTag
                value={item.gik}
                trueText="GIK"
                falseText="Not GIK"
                grayWhenFalse
                key="gik"
              />,
              <div onClick={(e) => e.stopPropagation()} key={1}>
                <Menu as="div" className="relative float-right">
                  <MenuButton>
                    <DotsThree weight="bold" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max">
                    <MenuItem
                      as="button"
                      className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleEditItem()}
                    >
                      <PencilSimple className="inline-block mr-2" size={22} />
                      Edit item details
                    </MenuItem>
                    <MenuItem
                      as="button"
                      className="flex w-full px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                      onClick={() => handleDeleteItem(item)}
                    >
                      <TrashSimple className="inline-block mr-2" size={22} />
                      Delete item
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>,
            ],
          }))}
          headerCellStyles="min-w-32"
        />
      )}
    </>
  );
}
