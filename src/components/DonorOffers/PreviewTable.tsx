import { useEffect } from "react";
import BaseTable, {extendTableHeader} from "../baseTable/BaseTable";
import type { PriceCheck } from "@/types/api/donorOffer.types";
import PriceCheckBadge from "./PriceCheckBadge";
import { isBlockingStatus } from "@/util/priceCheck";

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
  ndc?: string;
  additionalInfo?: Record<string, unknown>;
  // TEMP (#380): optional until the backend ticket attaches these to every
  // Preview row — see src/types/api/donorOffer.types.ts.
  row?: number;
  priceCheck?: PriceCheck;
};

interface PreviewTableProps {
  data: DonorOfferItem[];
  final: boolean;
  /** Called when a row's "Add price"/"Re-check" button is clicked. */
  onPriceAction?: (item: DonorOfferItem) => void;
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

export const PreviewTable = ({ data, final, onPriceAction }: PreviewTableProps) => {
  useEffect(() => {
    console.log(data, final);
  }, [data, final]);

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

  // Finalized offer table with mapped sheet columns plus NDC
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
          extendTableHeader("Cost Per Piece (Donor)", "min-w-28"),
          extendTableHeader("Status", "min-w-32"),
          extendTableHeader("Code", "min-w-32"),
          extendTableHeader("Our Price", "min-w-24"),
          extendTableHeader("Price Set", "min-w-28"),
          extendTableHeader("Value", "min-w-24"),
          extendTableHeader("Category", "min-w-24"),
          extendTableHeader("Type", "min-w-20"),
          extendTableHeader("NDC", "min-w-32"),
          extendTableHeader("Actions", "min-w-28"),
          extendTableHeader("Additional Info", "min-w-24 text-center"),
        ]}
        rows={data.map((item, index) => {
          const priceCheck = item.priceCheck;
          const canAct = priceCheck && isBlockingStatus(priceCheck.status) && onPriceAction;

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
              priceCheck ? <PriceCheckBadge key={`status-${index}`} status={priceCheck.status} /> : "-",
              priceCheck?.code
                ? `${priceCheck.code}${priceCheck.codeType ? ` (${priceCheck.codeType})` : ""}`
                : "-",
              priceCheck?.price != null ? `$${Number(priceCheck.price).toFixed(2)}` : "-",
              priceCheck?.priceSetOn ?? "-",
              priceCheck?.value != null ? `$${Number(priceCheck.value).toFixed(2)}` : "-",
              item.category || "-",
              item.type || "-",
              item.ndc || "-",
              canAct ? (
                <button
                  key={`action-${index}`}
                  type="button"
                  onClick={() => onPriceAction!(item)}
                  className="text-red-600 underline text-sm whitespace-nowrap"
                >
                  {priceCheck!.status === "expired" ? "Re-check" : "Add price"}
                </button>
              ) : (
                "-"
              ),
              <AdditionalInfoTooltip
                key={`info-${index}`}
                info={item.additionalInfo || {}}
              />,
            ],
          };
        })}
      />
    </div>
  );
};
