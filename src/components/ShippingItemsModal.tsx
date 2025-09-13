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
          rows={items.map((item, index) => ({
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
              <div key="itemNotes">
                <ChatTeardropText
                  data-tooltip-id={`comment-tooltip-${item.title}-${item.lotNumber}`}
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
              </div>,
              <DotsThree size={24} key="options" />,
            ],
          }))}
          pageSize={5}
        />
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
