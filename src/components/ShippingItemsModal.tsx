import { X, DotsThree } from "@phosphor-icons/react";
import React from "react";
import { ItemEntry } from "@/screens/AdminDistributionsScreen/ShippingStatus";
import { ChatTeardropText } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import BaseTable from "./BaseTable";

interface ShippingItemsModalProps {
  setIsOpen: (isOpen: boolean) => void; // Explicitly typing setIsOpen
  donorShippingNumber: string;
  hfhShippingNumber: string;
  items: ItemEntry[];
}

export default function ShippingItemsModal({
  setIsOpen,
  donorShippingNumber,
  hfhShippingNumber,
  items,
}: ShippingItemsModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
      <div className="flex flex-col bg-white p-8 rounded-lg shadow-lg w-[1500px] relative max-h-[90vh] text-gray-primary">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            {donorShippingNumber}, {hfhShippingNumber}: Items
          </h2>
          <X
            onClick={() => setIsOpen(false)}
            size={24}
            className="cursor-pointer"
          />
        </div>
        {/*remember to make fixed with*/}
        <BaseTable
          headers={[
            "Name",
            "Quantity Allocated",
            "Qty Avail/Total",
            "Donor Name",
            "Pallet",
            "Box Number",
            "Lot Number",
            "Unit Price",
            "Donor Shipping #",
            "HfH Shipping #",
            "Comment",
            "Manage",
          ]}
          rows={items.map((item) => ({
            cells: [
              item.title,
              item.quantityAllocated,
              `${item.quantityAvailable}/${item.quantityTotal}`,
              item.donorName,
              item.palletNumber,
              item.boxNumber,
              item.lotNumber,
              item.unitPrice,
              item.donorShippingNumber,
              item.hfhShippingNumber,
              <ChatTeardropText
                data-tooltip-id={`comment-tooltip-${item.title}-${item.lotNumber}`}
                data-tooltip-content={item.comment}
                className={`cursor-pointer`}
                size={30}
                weight={item.comment ? "bold" : "regular"}
                key={1}
              />,
              <DotsThree size={24} key={2} />,
            ],
          }))}
          pageSize={5}
          headerClassName="bg-blue-primary opacity-80 text-white"
        />
        <div className="overflow-x-scroll overflow-y-scroll my-4">
          {/*TODO: COPY FROM HIDDEN/VISIBLE ITEMS TABLES TO POPULATE THIS */}
          <table className="rounded-t-lg overflow-hidden table-fixed w-full">
            <thead>
              <tr className="bg-[#2774AE] bg-opacity-80 text-white border-b-2 break-words">
                <th className="px-4 py-4 text-left font-bold">Name</th>
                <th className="px-4 py-4 text-left font-bold">
                  Quantity Allocated
                </th>
                <th className="px-4 py-4 text-left font-bold">
                  Qty Avail/Total
                </th>
                <th className="px-4 py-4 text-left font-bold">Donor Name</th>
                <th className="px-4 py-4 text-left font-bold">Pallet</th>
                <th className="px-4 py-4 text-left font-bold">Box Number</th>
                <th className="px-4 py-4 text-left font-bold">Lot Number</th>
                <th className="px-4 py-4 text-left font-bold">Unit Price</th>
                <th className="px-4 py-4 text-left font-bold">
                  Donor Shipping #
                </th>
                <th className="px-4 py-4 text-left font-bold">
                  HfH Shipping #
                </th>
                <th className="px-4 py-4 text-left font-bold">Comment</th>
                <th className="px-4 py-4 text-left font-bold">Manage</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    data-odd={index % 2 !== 0}
                    className={`bg-white data-[odd=true]:bg-gray-50 break-words`}
                  >
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2">{item.quantityAllocated}</td>
                    <td className="px-4 py-2">
                      {item.quantityAvailable}/{item.quantityTotal}
                    </td>
                    <td className="px-4 py-2">{item.donorName}</td>
                    <td className="px-4 py-2">{item.palletNumber}</td>
                    <td className="px-4 py-2">{item.boxNumber}</td>
                    <td className="px-4 py-2">{item.lotNumber}</td>
                    <td className="px-4 py-2">{item.unitPrice}</td>
                    <td className="px-4 py-2">{item.donorShippingNumber}</td>
                    <td className="px-4 py-2">{item.hfhShippingNumber}</td>
                    <td className="px-4 py-2">
                      <ChatTeardropText
                        data-tooltip-id={`comment-tooltip-${index}`}
                        data-tooltip-content={item.comment}
                        className={`cursor-pointer`}
                        size={30}
                        weight={item.comment ? "bold" : "regular"}
                      />
                      {item.comment && (
                        <Tooltip
                          id={`comment-tooltip-${index}`}
                          className="max-w-40"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <DotsThree size={24} />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="border border-mainRed text-mainRed px-6 py-3 w-60 rounded-[4px] font-semibold"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
