import { useUser } from "@/components/context/UserContext";
import BaseTable from "../BaseTable";

type DataItem = {
  title: string;
  donorName: string;
  type: string;
  category: string;
  quantity: string;
  expirationDate: string;
  unitSize: string;
  unitType: string;
  datePosted: string;
  lotNumber: string;
  palletNumber: string;
  boxNumber: string;
  donorShippingNumber: string;
  hfhShippingNumber: string;
  unitPrice: string;
  maxRequestLimit: string;
  ndc: string;
  notes: string;
  visible: boolean;
  allowAllocations: boolean;
  gik: boolean;
};

interface DataTableProps {
  data: DataItem[];
}

// Helper function to format dates (generic function for expirationDate and datePosted)
function formatDate(dateString: string): string {
  if (!dateString) return ""; // Return empty string if date is empty
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
}

export default function DataTable({ data }: DataTableProps) {
  const { user } = useUser();

  if (!Array.isArray(data) || data.length === 0) {
    return <div>No data available</div>; // Show a message if no data is present
  }

  const headers = Object.keys(data[0]);

  // Determine the split index for visibility (adjust depending on user type)
  const unitSizeIndex = headers.indexOf("unitSize") + 1;
  const visibleHeaders =
    user?.type === "PARTNER" ? headers.slice(0, unitSizeIndex) : headers;

  return (
    <div className="p-4 mt-6 bg-zinc-100 border border-zinc-300 rounded">
      <BaseTable
        headers={[
          "Title",
          "Type",
          "Expiration",
          "Unit type",
          "Qty/Unit",
          "Donor Name",
          "Category",
          "Quantity",
          "Date Posted",
          "Lot Number",
          "Pallet",
          "Box Number",
          "Donor Shipping #",
          "HfH Shipping #",
          "Unit Price",
          "Max Limit",
          "NDC",
          "Visibility",
          "Allocations",
          "GIK",
        ]}
        rows={data.map((item) => ({
          cells: visibleHeaders.map((header) => (
            <span
              className={`${
                header === "visible"
                  ? item.visible
                    ? "bg-green-50 px-2 py-1 rounded text-green-700"
                    : "bg-red-50 px-2 py-1 rounded text-red-700"
                  : header === "gik"
                    ? item.gik
                      ? "bg-green-50 px-2 py-1 rounded text-green-700"
                      : "px-2 py-0.5 inline-block rounded bg-gray-primary bg-opacity-5 text-gray-primary"
                    : header === "allowAllocations"
                      ? item.allowAllocations
                        ? "bg-green-50 px-2 py-1 rounded text-green-700"
                        : "bg-red-50 px-2 py-1 rounded text-red-700"
                      : ""
              }`}
              key={header}
            >
              {header === "visible"
                ? item.visible
                  ? "Visible"
                  : "Disabled"
                : header === "allowAllocations"
                  ? item[header as keyof DataItem] === true
                    ? "Allowed" // If `true`, show blank
                    : "Disabled" // Otherwise, show the value
                  : header === "gik"
                    ? item[header as keyof DataItem] === true
                      ? "GIK"
                      : "Not GIK"
                    : header === "expirationDate" || header === "datePosted"
                      ? formatDate(item[header as keyof DataItem] as string) // Format date fields
                      : (item[header as keyof DataItem] as string)}
            </span>
          )),
        }))}
        pageSize={10}
      />
    </div>
  );
}
