import { ShippingStatus, Item, ShipmentStatus } from "@prisma/client";
import { CgChevronRight, CgSpinner } from "react-icons/cg";
import React, { useCallback } from "react";
import { ItemEntry } from "@/screens/AdminDistributionsScreen/ShippingStatus";
import { useParams } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { useApiClient } from "@/hooks/useApiClient";
import { toast } from "react-hot-toast";

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
        toast.error(`Failed to update shipping status: ${(error as Error).message}`);
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
    <div className="overflow-x-scroll">
      <table className="mt-4 rounded-t-lg overflow-hidden table-fixed w-full">
        <thead>
          <tr className="bg-[#2774AE] bg-opacity-80 text-white border-b-2 break-words">
            <th className="px-4 py-4 text-left font-bold">
              Donor Shipping Number
            </th>
            <th className="px-4 py-4 text-left font-bold">
              HfH Shipping Number
            </th>
            <th className="px-4 py-4 text-left font-bold">Shipping Status</th>
            <th className="px-4 py-4 text-left font-bold w-[160px]">
              View Items
            </th>
          </tr>
        </thead>
        <tbody>
          {shippingStatuses.map((status, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 0}
                className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
              >
                <td className="px-4 py-2">{status.donorShippingNumber}</td>
                <td className="px-4 py-2">{status.hfhShippingNumber}</td>
                <td className="px-4 py-2">
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
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <span className="rounded flex justify-center items-center">
                    <CgChevronRight
                      color="#2774AE"
                      size={28}
                      onClick={() => {
                        openModal(
                          status.hfhShippingNumber,
                          status.donorShippingNumber,
                          items[status.id] || []
                        );
                      }}
                      className="cursor-pointer"
                    />
                  </span>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Load in shipping status colors here */}
      <br className="bg-[#CD1EC7] hidden" />
      <br className="bg-[#EC610B] hidden" />
      <br className="bg-[#ECB70B] hidden" />
      <br className="bg-[#829D20] hidden" />
      <br className="bg-[#C7EAD8] hidden" />
      <br className="bg-[#0A7B40] hidden" />
    </div>
  );
}
