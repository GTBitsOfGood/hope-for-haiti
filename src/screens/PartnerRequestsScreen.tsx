"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, ChatTeardropText } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Item,
  UnallocatedItemRequest,
  UnallocatedItemRequestAllocation,
} from "@prisma/client";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import { formatTableValue } from "@/utils/format";
import EditAllocationModal from "@/components/EditAllocationModal";
import { UnallocatedItem } from "@/app/api/unallocatedItemRequests/types";

type RequestWithAllocations = UnallocatedItemRequest & {
  allocations: (UnallocatedItemRequestAllocation & {
    unallocatedItem: Item;
  })[];
  partner: {
    name: string;
  };
};

const Priority = ({ priority }: { priority: string }) => {
  let color = "bg-gray-200";
  if (priority === "HIGH") {
    color = "bg-red-primary";
  } else if (priority === "MEDIUM") {
    color = "bg-orange-primary";
  } else if (priority === "LOW") {
    color = "bg-green-dark";
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded-md bg-opacity-20 ${color}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
    </span>
  );
};

export default function PartnerRequestsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const itemName = searchParams.get("title");
  const itemType = searchParams.get("type");
  const itemExpirationDate = searchParams.get("expirationDate");
  const unitType = searchParams.get("unitType");
  const quantityPerUnit = searchParams.get("quantityPerUnit");
  const generalItem = {
    title: itemName as string,
    type: itemType as string,
    unitType: unitType as string,
    quantityPerUnit: quantityPerUnit as string,
    ...(itemExpirationDate ? { expirationDate: itemExpirationDate } : {}),
  };

  const [requests, setRequests] = useState<RequestWithAllocations[]>([]);
  const [items, setItems] = useState<UnallocatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditAllocationModalIsOpen, setIsEditAllocationModalIsOpen] =
    useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<
    (UnallocatedItemRequestAllocation & { unallocatedItem: Item }) | null
  >(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const response = await fetch(
        `/api/unallocatedItemRequests?${new URLSearchParams(generalItem).toString()}`
      );

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      setRequests(data.requests);
      setItems(data.items);
      console.log(data.requests);
      console.log(data.items);
    } catch (e) {
      toast.error("Error fetching unallocated item requests", {
        position: "bottom-right",
      });
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  }, [itemExpirationDate, itemName, itemType, quantityPerUnit, unitType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Allocation updated successfully", {
        position: "bottom-right",
      });
      setIsSuccess(false);

      fetchData();
    }
  }, [fetchData, isSuccess]);

  return (
    <>
      {isEditAllocationModalIsOpen && (
        <EditAllocationModal
          setIsOpen={setIsEditAllocationModalIsOpen}
          items={items}
          allocation={selectedAllocation!}
          unitType={generalItem.unitType}
          quantityPerUnit={parseInt(generalItem.quantityPerUnit)}
          expirationDate={generalItem.expirationDate || null}
          title={itemName!}
          type={itemType!}
          setIsSuccess={setIsSuccess}
        />
      )}
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-1">
          <Link
            href="/unallocatedItems"
            className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
          >
            Unallocated Items
          </Link>
          <span className="text-gray-500 text-opacity-70">/</span>
          <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
            {itemName}
          </span>
        </div>
        <Link
          href="/unallocatedItems"
          className="flex items-center gap-2 border border-red-500 text-red-500 bg-white px-4 py-1 rounded-lg font-medium hover:bg-red-50 transition"
        >
          Back to Unallocated Items
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">
        {itemName}:{" "}
        <span className="text-gray-primary text-opacity-70">
          Partner Requests
        </span>
      </h1>
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
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <div className="overflow-x-scroll">
          <table className="mt-4 min-w-full">
            <thead>
              <tr className="bg-blue-primary opacity-80 text-white font-bold border-b-2">
                <th className="px-4 py-2 rounded-tl-lg text-left">Partner</th>
                <th className="px-4 py-2 text-left">Date requested</th>
                <th className="px-4 py-2 text-left">Requested quantity</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Allocated quantity</th>
                <th className="px-4 py-2 text-left">
                  Allocated summary (lot, pallet, box)
                </th>
                <th className="px-4 py-2 rounded-tr-lg text-left">Comment</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors hover:bg-gray-100`}
                  >
                    <td className="px-4 py-2">
                      {formatTableValue(request.partner.name)}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {formatTableValue(request.quantity)}
                    </td>
                    <td className="px-4 py-2">
                      <Priority priority={request.priority} />
                    </td>
                    <td className="px-4 py-2">
                      {formatTableValue(
                        request.allocations?.reduce(
                          (sum, alloc) => sum + alloc.quantity,
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {request.allocations.map((alloc) => (
                        <div
                          key={alloc.id}
                          className="hover:text-red-500 cursor-pointer"
                          onClick={() => {
                            setIsSuccess(false);
                            setSelectedAllocation(alloc);
                            setIsEditAllocationModalIsOpen(true);
                          }}
                        >
                          {`${alloc.quantity} - ${alloc.unallocatedItem.lotNumber}, ${alloc.unallocatedItem.palletNumber}, ${alloc.unallocatedItem.boxNumber}`}
                        </div>
                      ))}
                      {request.allocations && request.allocations.length > 0 ? (
                        <>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(
                                `/newAllocation?${new URLSearchParams({
                                  unallocatedItemRequestId:
                                    request.id.toString(),
                                  ...generalItem,
                                }).toString()}`
                              );
                            }}
                            className="mt-1 rounded-md px-2 py-1 text-gray-primary bg-gray-primary bg-opacity-5 text-opacity-50 text-sm transition hover:bg-opacity-10 hover:text-opacity-70"
                          >
                            + Add
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(
                              `/newAllocation?${new URLSearchParams({
                                unallocatedItemRequestId: request.id.toString(),
                                ...generalItem,
                              }).toString()}`
                            );
                          }}
                          className="border-dashed border border-gray-primary rounded-md px-2 py-1 text-gray-primary opacity-50 text-sm transition hover:opacity-100"
                        >
                          + Add Allocation
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 flex justify-center">
                      <ChatTeardropText
                        data-tooltip-id={`comment-tooltip-${request.id}`}
                        data-tooltip-content={request.comments}
                        size={30}
                        color={request.comments ? "black" : "lightgray"}
                      />
                      {request.comments && (
                        <Tooltip
                          id={`comment-tooltip-${request.id}`}
                          className="max-w-40"
                        />
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
