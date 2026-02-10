import { useEffect } from "react";
import BaseTable, { extendTableHeader, tableConditional } from "../baseTable/BaseTable";

// Define donor offer item data type based on schema
export type DonorOfferItem = {
  title: string;
  expirationDate?: Date | string | null;
  unitType: string;
  quantity?: number;
  initialQuantity?: number;

  unitPrice?: number;
  lotNumber?: string;
  palletNumber?: string;
  boxNumber?: string;
  maxRequestLimit?: string;
  donorShippingNumber?: string;
  hfhShippingNumber?: string;
  visible?: boolean;
  notes?: string;
  description?: string;
};

interface PreviewTableProps {
  data: DonorOfferItem[];
  final: boolean;
}

export const PreviewTable = ({ data, final }: PreviewTableProps) => {
  
  useEffect(() => {
    console.log(data, final)
  }, [data, final])
  
  return (
  <div className="overflow-x-auto mt-4 bg-white rounded">
    <BaseTable
      pagination={false}
      headers={[
        extendTableHeader("Title", "min-w-96"),
        "Quantity",
        "Unit Type",
        "Expiration",
        tableConditional(final, [
          "Unit Price",
          "Lot",
          "Pallet",
          "Box",
          "Donor Shipping #",
          "HfH Shipping #",
        ]),
      ]}
      rows={data.map((item) => {
        const displayQuantity =
          item.quantity ?? item.initialQuantity ?? 0;

        return {
          cells: [
            item.title,
            displayQuantity,
            item.unitType,
            item.expirationDate
              ? new Date(item.expirationDate).toLocaleDateString()
              : "N/A",
            tableConditional(final, [
              item.unitPrice,
              item.lotNumber,
              item.palletNumber,
              item.boxNumber,
              item.donorShippingNumber,
              item.hfhShippingNumber,
            ]),
          ],
        };
      })}
    />
  </div>
);};
