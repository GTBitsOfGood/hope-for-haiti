import { useState } from "react";
import DetailedChip from "./DetailedChip";
import { Package } from "@phosphor-icons/react";

export default function ShipmentsLineItemChipGroup({
  lineItems,
}: {
  lineItems: {
    id: number;
    title: string;
    quantity: number;
    partnerName: string;
    partnerId: number;
    palletNumber: string;
  }[];
}) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  return (
    <div className="w-full bg-sunken flex flex-wrap p-2">
      {lineItems.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No line items available.
        </p>
      )}
      {lineItems.map((item) => (
        <DetailedChip
          key={`${item.id}-${item.partnerId}`}
          title={item.title}
          subtitle={`Pallet ${item.palletNumber}`}
          label={item.partnerName}
          amount={item.quantity}
          icon={
            <Package size={16} className="text-blue-primary flex-shrink-0" />
          }
          selected={selectedItems.has(item.id)}
          onClick={() => {
            const newSelectedItems = new Set(selectedItems);
            if (newSelectedItems.has(item.id)) {
              newSelectedItems.delete(item.id);
            } else {
              newSelectedItems.add(item.id);
            }
            setSelectedItems(newSelectedItems);
          }}
        />
      ))}
    </div>
  );
}
