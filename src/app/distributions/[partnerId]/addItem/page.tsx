"use client";

import React, { useCallback, useState } from "react";
import { LineItem } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { ChatTeardropText, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { Tooltip } from "react-tooltip";
import AddToDistributionModal from "@/components/AddToDistributionModal";
import toast from "react-hot-toast";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable from "@/components/baseTable/AdvancedBaseTable";
import { ColumnDefinition, FilterList } from "@/types/ui/table.types";

interface Partner {
  name: string;
}

export default function AddItemToDistributionPage() {
  const { partnerId } = useParams();
  const router = useRouter();
  const { apiClient } = useApiClient();

  const [selectedItem, setSelectedItem] = useState<LineItem>();
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

  const fetchFn = useCallback(
    async (pageSize: number, page: number, filters: FilterList<LineItem>) => {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(),
        filters: JSON.stringify(filters),
      });
      const items = await apiClient.get<LineItem[]>(
        `/api/items?${params.toString()}`
      );
      return { data: items, total: items.length };
    },
    [apiClient]
  );

  const columns: ColumnDefinition<LineItem>[] = [
    {
      id: "title",
      header: "Name"
    },
    "quantity",
    {
      id: "donorName",
      header: "Donor name",
      cell: (item) => item.donorName,
    },
    {
      id: "palletNumber",
      header: "Pallet number",
      cell: (item) => item.palletNumber,
    },
    {
      id: "boxNumber",
      header: "Box number",
      cell: (item) => item.boxNumber,
    },
    "boxNumber",
    "lotNumber",
    {
      id: "unitPrice",
      header: "Unit price",
      cell: (item) => item.unitPrice?.toString?.() ?? "",
    },
    {
      id: "donorShippingNumber",
      header: "Donor Shipping #",
    },
    {
      id: "hfhShippingNumber",
      header: "HfH Shipping #",
    },
    {
      id: "comment",
      header: "Comment",
      cell: (item) => (
        <div className="flex justify-center">
          <ChatTeardropText
            data-tooltip-id={`comment-tooltip-${item.id}`}
            data-tooltip-content={item.notes || "No notes"}
            size={30}
            color={item.notes ? "black" : "lightgray"}
          />
          {item.notes && (
            <Tooltip id={`comment-tooltip-${item.id}`} className="max-w-40">
              {item.notes}
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      id: "add",
      header: "Add",
      headerClassName: "w-12",
      cellClassName: "w-12",
      cell: (item) => (
        <button
          className="bg-blue-primary bg-opacity-20 rounded flex items-center justify-center w-8 h-8"
          onClick={() => {
            setSelectedItem(item);
            setIsModalOpen(true);
          }}
        >
          <Plus className="text-blue-primary" weight="bold" />
        </button>
      ),
    },
  ];

  const handleAddToDistribution = async (
    quantity: number,
    visible: boolean
  ): Promise<boolean> => {
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
      {partnerLoading ? (
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
          <AdvancedBaseTable
            columns={columns}
            fetchFn={fetchFn}
            rowId="id"
            headerCellStyles="min-w-32"
            emptyState="No items available"
          />
        </>
      )}
      {isModalOpen && selectedItem && partner?.name && (
        <AddToDistributionModal
          partnerName={partner.name}
          maxQuantity={selectedItem.quantity}
          unitType={selectedItem.unitPrice?.toString?.() ?? ""}
          onClose={(success) => {
            setIsModalOpen(false);
            setSelectedItem(undefined);
            if (success) {
              router.push(`/distributions/${partnerId}`);
            }
          }}
          onSubmit={handleAddToDistribution}
        />
      )}
    </>
  );
}
