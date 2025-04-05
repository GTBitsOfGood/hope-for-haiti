/* eslint-disable @typescript-eslint/no-unused-vars */
// page unfinished so disabling this rule for now

import { ShippingStatus } from "@prisma/client";
import { CgChevronRight, CgSpinner } from "react-icons/cg";
import React, { useEffect, useState } from "react";
import { ItemEntry } from "@/screens/AdminDistributionsScreenTabs/ShippingStatus";

interface ShippingStatusTableProps {
  openModal: (
    hfhShippingNumber: string,
    donorShippingNumber: string,
    items: ItemEntry[]
  ) => void;
}

const statusTags = {
  WAITING_ARRIVAL_FROM_DONOR: (
    <div className="inline-block bg-[#CD1EC7] bg-opacity-20 text-gray-primary px-2 py-1 rounded">
      Waiting arrival from donor
    </div>
  ),
  LOAD_ON_SHIP_AIR: (
    <div className="inline-block bg-[#EC610B] bg-opacity-20 text-gray-primary px-2 py-1 rounded">
      Loaded on ship/air
    </div>
  ),
  ARRIVED_IN_HAITI: (
    <div className="inline-block bg-[#ECB70B] bg-opacity-20 text-gray-primary px-2 py-1 rounded">
      Arrived in Haiti
    </div>
  ),
  CLEARED_CUSTOMS: (
    <div className="inline-block bg-[#829D20] bg-opacity-20 text-gray-primary px-2 py-1 rounded">
      Cleared customs
    </div>
  ),
  ARRIVED_AT_DEPO: (
    <div className="inline-block bg-[#C7EAD8] text-gray-primary px-2 py-1 rounded">
      Arrived at depo
    </div>
  ),
  INVENTORIES: <></>,
  READY_FOR_DISTRIBUTION: (
    <div className="inline-block bg-[#0A7B40] bg-opacity-80 text-gray-primary px-2 py-1 rounded">
      Ready for distribution
    </div>
  ),
};

export default function ShippingStatusTable({
  openModal,
}: ShippingStatusTableProps) {
  const [shippingStatuses, setShippingStatuses] = useState<ShippingStatus[]>(
    []
  );
  const [mockShippingStatuses, setMockShippingStatuses] = useState<
    ShippingStatus[]
  >([
    {
      id: 1,
      donorShippingNumber: "123456781",
      hfhShippingNumber: "987654323",
      value: "WAITING_ARRIVAL_FROM_DONOR",
    },
    {
      id: 2,
      donorShippingNumber: "123456782",
      hfhShippingNumber: "987654322",
      value: "LOAD_ON_SHIP_AIR",
    },
    {
      id: 3,
      donorShippingNumber: "123456783",
      hfhShippingNumber: "987654321",
      value: "ARRIVED_IN_HAITI",
    },
  ]);
  const [items, setItems] = useState<Record<number, ItemEntry[]>>({
    1: [
      {
        title: "Item 1",
        quantityAllocated: 10,
        quantityAvailable: 5,
        quantityTotal: 15,
        donorName: "Donor 1",
        palletNumber: 1,
        boxNumber: 2,
        lotNumber: 23,
        unitPrice: 100,
        donorShippingNumber: "123456781",
        hfhShippingNumber: "987654323",
        comment: "Comment 1",
      },
    ],
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    /*
    setTimeout(async () => {
      const response = await fetch("api/shippingStatuses", {
        method: "GET",
      });
      const data = await response.json();
      setShippingStatuses(data.shippingStatuses);
      setIsLoading(false);
    }, 1000);
    */
  }, []);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-8">
        <CgSpinner className="w-16 h-16 animate-spin opacity-50" />
      </div>
    );
  }
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
          {mockShippingStatuses.map((status, index) => (
            <React.Fragment key={index}>
              <tr
                data-odd={index % 2 !== 0}
                className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
              >
                <td className="px-4 py-2">{status.donorShippingNumber}</td>
                <td className="px-4 py-2">{status.hfhShippingNumber}</td>
                <td className="px-4 py-2">{statusTags[status.value]}</td>
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
    </div>
  );
}
