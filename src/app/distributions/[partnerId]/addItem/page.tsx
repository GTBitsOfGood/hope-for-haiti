"use client";

import React, { useState } from "react";
import { Item } from "@prisma/client";
import { useParams } from "next/navigation";
import { ChatTeardropText, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { Tooltip } from "react-tooltip";
import { formatTableValue } from "@/utils/format";
import AddToDistributionModal from "@/components/AddToDistributionModal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";

interface Partner {
  name: string;
}

export default function AddItemToDistributionPage() {
  const { partnerId } = useParams();
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<Item>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: partner, isLoading: partnerLoading } = useFetch<Partner>(
    `/api/partners/${partnerId}`,
    {
      cache: "no-store",
      onError: (error) => {
        console.log(error);
        toast.error("Error fetching partner details", {
          position: "bottom-right",
        });
      },
    }
  );

  const { data: lineItems, isLoading: itemsLoading } = useFetch<Item[]>(
    `/api/items`,
    {
      cache: "no-store",
      onError: (error) => {
        console.log(error);
        toast.error("Error fetching line items", { position: "bottom-right" });
      },
    }
  );

  const isLoading = partnerLoading || itemsLoading;

  const handleAddToDistribution = async (quantity: number, visible: boolean): Promise<boolean> => {
    if (!selectedItem) return false;

    const body = new FormData();
    body.append("itemId", String(selectedItem.id));
    body.append("quantity", String(quantity));
    body.append("partnerId", String(partnerId));
    body.append("visible", String(visible));

    try {
      const response = await fetch(`/api/allocations`, {
        method: "POST",
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(
          `Failed to add item to distribution: "${errorData.message}"`,
          {
            position: "bottom-right",
          }
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log(error);
      toast.error("Network error occurred", {
        position: "bottom-right",
      });
      return false;
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center mt-8">
          <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1 pb-8">
            <div className="flex items-center gap-1">
              <Link
                href="/distributions"
                className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
              >
                Pending Distributions
              </Link>
              <span className="text-gray-500 text-sm flex items-center">/</span>
              <Link
                href={`/distributions/${partnerId}`}
                className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
              >
                {partner?.name}
              </Link>
              <span className="text-gray-500 text-sm flex items-center">/</span>
              <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
                Add Item
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold">
            Add Item to Pending Distribution
          </h1>
          <div className="relative w-1/3 mt-4">
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

          <div className="overflow-x-scroll pb-2">
            <table className="mt-4 min-w-full">
              <thead>
                <tr className="bg-blue-primary opacity-80 text-white font-bold border-b-2">
                  <th className="px-4 py-2 min-w-32 rounded-tl-lg text-left">
                    Name
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">Quantity</th>
                  <th className="px-4 py-2 min-w-32 text-left">Donor name</th>
                  <th className="px-4 py-2 min-w-32 text-left">Pallet</th>
                  <th className="px-4 py-2 min-w-32 text-left">Box number</th>
                  <th className="px-4 py-2 min-w-32 text-left">Lot number</th>
                  <th className="px-4 py-2 min-w-32 text-left">Unit price</th>
                  <th className="px-4 py-2 min-w-32 text-left">
                    Donor Shipping #
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">
                    HfH Shipping #
                  </th>
                  <th className="px-4 py-2 min-w-32 text-left">Comment</th>
                  <th className="px-4 py-2 rounded-tr-lg text-left w-12">
                    Add
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems?.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr
                      data-odd={index % 2 !== 0}
                      className={`bg-white data-[odd=true]:bg-gray-50 border-b transition-colors`}
                    >
                      <td className="px-4 py-2">
                        {formatTableValue(item.title)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.quantity)}
                      </td>
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
                        {formatTableValue(item.donorShippingNumber)}
                      </td>
                      <td className="px-4 py-2">
                        {formatTableValue(item.hfhShippingNumber)}
                      </td>
                      <td className="px-4 py-2 flex justify-center">
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
                        <button
                          className="bg-blue-primary bg-opacity-20 rounded flex items-center justify-center w-8 h-8"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsModalOpen(true);
                          }}
                        >
                          <Plus className="text-blue-primary" weight="bold" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {isModalOpen && selectedItem && partner?.name && (
        <AddToDistributionModal
          onClose={(success) => {
            setIsModalOpen(false);
            setSelectedItem(undefined);
            if (success) {
              router.push(`/distributions/${partnerId}`);
            }
          }}
          partnerName={partner.name}
          maxQuantity={selectedItem.quantity}
          unitType={selectedItem.unitType || ""}
          onSubmit={handleAddToDistribution}
        />
      )}
    </>
  );
}
