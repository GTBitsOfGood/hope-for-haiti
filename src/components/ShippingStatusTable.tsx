import { ShippingStatus } from "@prisma/client";
import { BiChevronRight } from "react-icons/bi";
import React, { useEffect, useState } from "react";

const statusTags = {
  WAITING_ARRIVAL_FROM_DONOR: (
    <div className="inline-block bg-[#CD1EC7] bg-opacity-20 text-gray-primary">
      Waiting arrival from donor
    </div>
  ),
  LOAD_ON_SHIP_AIR: <></>,
  ARRIVED_IN_HAITI: <></>,
  CLEARED_CUSTOMS: <></>,
  ARRIVED_AT_DEPO: <></>,
  INVENTORIES: <></>,
  READY_FOR_DISTRIBUTION: <></>,
};

export default function ShippingStatusTable() {
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
  return (
    <table className="mt-4 rounded-t-lg overflow-hidden table-fixed w-full">
      <thead>
        <tr className="bg-gray-primary bg-opacity-5 text-gray-primary text-opacity-70 border-b-2 break-words">
          <th className="px-4 py-2 w-[48px]"></th>
          <th className="px-4 py-2 text-left font-bold">
            Donor Shipping Number
          </th>
          <th className="px-4 py-2 text-left font-bold">HfH Shipping Number</th>
          <th className="px-4 py-2 text-left font-bold">Shipping Status</th>
          <th className="px-4 py-2 text-left font-bold">View Items</th>
        </tr>
      </thead>
      <tbody>
        {mockShippingStatuses.map((status, index) => (
          <React.Fragment key={index}>
            <tr
              data-odd={index % 2 !== 0}
              className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
            >
              <td className="px-4 py-2">
                <input
                  className="rounded bg-gray-primary bg-opacity-[0.025] border-gray-primary border-opacity-10"
                  type="checkbox"
                  name={`item-${index}`}
                />
              </td>
              <td className="px-4 py-2">{status.donorShippingNumber}</td>
              <td className="px-4 py-2">{status.hfhShippingNumber}</td>
              <td className="px-4 py-2">{statusTags[status.value]}</td>
              <td className="px-4 py-2">
                <BiChevronRight color="#2774AE" className="opacity-20" />
              </td>
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
