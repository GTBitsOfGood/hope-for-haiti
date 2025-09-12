import BaseTable, { tableConditional } from "../BaseTable";

// Define donor offer item data type based on schema
export type DonorOfferItem = {
  title: string;
  type: string;
  expirationDate: Date;
  unitType: string;
  quantityPerUnit: string;
  quantity: number;

  unitPrice?: number;
  lotNumber?: string;
  palletNumber?: string;
  boxNumber?: string;
  maxRequestLimit?: string;
  donorShippingNumber?: string;
  hfhShippingNumber?: string;
  visible?: boolean;
  notes?: string;
};

interface PreviewTableProps {
  data: DonorOfferItem[];
  final: boolean;
}

export const PreviewTable = ({ data, final }: PreviewTableProps) => (
  <div className="p-4 mt-6 bg-zinc-100 border border-zinc-300 rounded">
    <BaseTable
      headers={[
        "Title",
        "Type",
        "Quantity",
        "Unit Type",
        "Quantity Per Unit",
        "Expiration",
        ...tableConditional(final, [
          "Unit Price",
          "Lot",
          "Pallet",
          "Box",
          "Max Limit",
          "Donor Shipping #",
          "HfH Shipping #",
          "Visibility",
          "Comment",
        ]),
      ]}
      rows={data.map((item) => ({
        cells: [
          item.title,
          item.type,
          item.quantity,
          item.unitType,
          item.quantityPerUnit,
          item.expirationDate
            ? new Date(item.expirationDate).toLocaleDateString()
            : "N/A",
          ...tableConditional(final, [
            item.unitPrice,
            item.lotNumber,
            item.palletNumber,
            item.boxNumber,
            item.maxRequestLimit,
            item.donorShippingNumber,
            item.hfhShippingNumber,
            item.visible ? "Visible" : "Hidden",
            item.notes,
          ]),
        ],
      }))}
      pageSize={10}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  </div>
);
