import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./Chip";

export default function ShipmentsGeneralItemChipGroup({
  generalItems,
}: {
  generalItems: Shipment["generalItems"];
}) {
  return (
    <div className="w-full bg-sunken flex flex-wrap p-2">
      {generalItems.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No line items available.
        </p>
      )}
      {generalItems.map((item) => (
        <Chip
          key={`${item.id}-${item.partner.id}`}
          title={item.title}
          label={item.partner.name}
          revisedAmount={item.lineItems.reduce(
            (total, li) => li.quantity + total,
            0
          )}
        />
      ))}
    </div>
  );
}
