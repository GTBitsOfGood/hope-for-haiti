import BaseTable, {
  extendTableHeader,
} from "../baseTable/BaseTable";

// Define donor offer item data type based on schema
export type DonorOfferItem = {
  title: string;
  donorName?: string;
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
  category?: string;
  type?: string;
  additionalInfo?: Record<string, unknown>;
};

interface PreviewTableProps {
  data: DonorOfferItem[];
  final: boolean;
}

const MagnifyingGlassIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-gray-500"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const AdditionalInfoTooltip = ({ info }: { info: Record<string, unknown> }) => {
  const entries = Object.entries(info);
  if (entries.length === 0) {
    return (
      <div className="group relative inline-block">
        <MagnifyingGlassIcon />
        <div className="invisible group-hover:visible absolute z-50 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg -translate-x-1/2 left-1/2">
          <div className="font-semibold mb-1">Additional Info</div>
          <div className="text-gray-300">No additional information</div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block">
      <MagnifyingGlassIcon />
      <div className="invisible group-hover:visible absolute z-50 w-56 p-3 mt-1 text-sm bg-gray-800 text-white rounded shadow-lg -translate-x-1/2 left-1/2">
        <div className="font-semibold mb-2 border-b border-gray-600 pb-1">
          Additional Info
        </div>
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-300">{key}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PreviewTable = ({ data, final }: PreviewTableProps) => {
  if (!final) {
    return (
      <div className="overflow-x-auto mt-4 bg-white rounded">
        <BaseTable
          pagination={false}
          headers={[
            extendTableHeader("Title", "min-w-96"),
            "Quantity",
            "Unit Type",
            "Expiration",
          ]}
          rows={data.map((item) => {
            const displayQuantity = item.quantity ?? item.initialQuantity ?? 0;

            return {
              cells: [
                item.title,
                displayQuantity,
                item.unitType,
                item.expirationDate
                  ? new Date(item.expirationDate).toLocaleDateString()
                  : "N/A",
              ],
            };
          })}
        />
      </div>
    );
  }

  // Finalized offer table with 12 columns in specified order
  return (
    <div className="overflow-x-auto mt-4 bg-white rounded">
      <BaseTable
        pagination={false}
        headers={[
          extendTableHeader("Pallet #", "min-w-24"),
          extendTableHeader("Box #", "min-w-20"),
          extendTableHeader("Description", "min-w-64"),
          extendTableHeader("Donor", "min-w-32"),
          extendTableHeader("Lot #", "min-w-24"),
          extendTableHeader("Expiration Date", "min-w-32"),
          extendTableHeader("Container Type", "min-w-28"),
          extendTableHeader("# of Containers", "min-w-28"),
          extendTableHeader("Cost Per Piece", "min-w-28"),
          extendTableHeader("Category", "min-w-24"),
          extendTableHeader("Type", "min-w-20"),
          extendTableHeader("Additional Info", "min-w-24 text-center"),
        ]}
        rows={data.map((item) => {
          return {
            cells: [
              item.palletNumber || "-",
              item.boxNumber || "-",
              item.title,
              item.donorName || "-",
              item.lotNumber || "-",
              item.expirationDate
                ? new Date(item.expirationDate).toLocaleDateString()
                : "-",
              item.unitType,
              item.quantity ?? 0,
              item.unitPrice != null
                ? `$${Number(item.unitPrice).toFixed(2)}`
                : "-",
              item.category || "-",
              item.type || "-",
              <AdditionalInfoTooltip
                key={`info-${item.title}`}
                info={item.additionalInfo || {}}
              />,
            ],
          };
        })}
      />
    </div>
  );
};
