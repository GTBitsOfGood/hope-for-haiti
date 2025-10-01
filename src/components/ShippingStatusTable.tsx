import { ShippingStatus, Item, ShipmentStatus } from "@prisma/client";
import { CgChevronRight, CgSpinner } from "react-icons/cg";
import React, { useCallback } from "react";
import { ItemEntry } from "@/screens/AdminDistributionsScreen/ShippingStatus";
import { useParams } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { toast } from "react-hot-toast";
import BaseTable from "./baseTable/BaseTable";

interface ShippingStatusTableProps {
  openModal: (
    hfhShippingNumber: string,
    donorShippingNumber: string,
    items: ItemEntry[]
  ) => void;
}

const statusOptions = [
  {
    value: ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR,
    label: "Waiting arrival from donor",
    color: "#CD1EC7",
  },
  {
    value: ShipmentStatus.LOAD_ON_SHIP_AIR,
    label: "Loaded on ship/air",
    color: "#EC610B",
  },
  {
    value: ShipmentStatus.ARRIVED_IN_HAITI,
    label: "Arrived in Haiti",
    color: "#ECB70B",
  },
  {
    value: ShipmentStatus.CLEARED_CUSTOMS,
    label: "Cleared customs",
    color: "#829D20",
  },
  {
    value: ShipmentStatus.ARRIVED_AT_DEPO,
    label: "Arrived at depo",
    color: "#C7EAD8",
  },
  { value: ShipmentStatus.INVENTORIES, label: "Inventoried", color: "#2774AE" },
  {
    value: ShipmentStatus.READY_FOR_DISTRIBUTION,
    label: "Ready for distribution",
    color: "#0A7B40",
  },
];

interface ShippingStatusData {
  shippingStatuses: ShippingStatus[];
  items: Item[][];
}

export default function ShippingStatusTable({
  openModal,
}: ShippingStatusTableProps) {
  const { partnerId } = useParams();
  const { apiClient } = useApiClient();

  const { data, isLoading, error, refetch } = useFetch<ShippingStatusData>(
    `/api/shippingStatus/${partnerId}`,
    {
      onError: (error) => {
        toast.error(`Failed to fetch shipping statuses: ${error}`);
      },
    }
  );

  const handleSelectStatus = useCallback(
    async (
      donorShippingNumber: string,
      hfhShippingNumber: string,
      status: ShipmentStatus
    ) => {
      try {
        await apiClient.put(
          `/api/shippingStatus?donorShippingNumber=${donorShippingNumber}&hfhShippingNumber=${hfhShippingNumber}&value=${status}`
        );

        toast.success("Shipping status updated successfully");
        refetch();
      } catch (error) {
        toast.error(
          `Failed to update shipping status: ${(error as Error).message}`
        );
      }
    },
    [apiClient, refetch]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-8">
        <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center mt-8">
        <p className="text-red-500">Error loading shipping statuses: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center mt-8">
        <p className="text-gray-500">No shipping status data available</p>
      </div>
    );
  }

  const shippingStatuses = data.shippingStatuses;
  const items = data.items.map((itemRow: Item[]) =>
    itemRow.map((item: Item): ItemEntry => {
      return {
        title: item.title,
        quantityAllocated: 0,
        quantityAvailable: 0,
        quantityTotal: 0,
        donorName: item.donorName,
        palletNumber: parseInt(item.palletNumber) || 0,
        boxNumber: parseInt(item.boxNumber) || 0,
        lotNumber: parseInt(item.lotNumber) || 0,
        unitPrice: item.unitPrice.toNumber(),
        donorShippingNumber: item.donorShippingNumber || "",
        hfhShippingNumber: item.hfhShippingNumber || "",
        comment: item.notes || "",
      };
    })
  );

  return (
    <BaseTable
      headers={[
        "Donor Shipping Number",
        "HfH Shipping Number",
        "Shipping Status",
        "View Items",
      ]}
      rows={shippingStatuses.map((status, index) => ({
        cells: [
          status.donorShippingNumber,
          status.hfhShippingNumber,
          <select
            className={`w-full rounded text-gray-primary border-none bg-opacity-20 p-2 text-[16px] focus:outline-none bg-[${statusOptions.find((opt) => opt.value === status.value)?.color}]`}
            value={status.value}
            onChange={(e) =>
              handleSelectStatus(
                status.donorShippingNumber,
                status.hfhShippingNumber,
                e.target.value as ShipmentStatus
              )
            }
            key={1}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>,
          <span className="rounded flex justify-center items-center" key={2}>
            <CgChevronRight
              color="#2774AE"
              size={28}
              onClick={() => {
                openModal(
                  status.hfhShippingNumber,
                  status.donorShippingNumber,
                  items[index] || []
                );
              }}
              className="cursor-pointer"
            />
          </span>,
        ],
      }))}
      pageSize={5}
    />
  );
}
