import { useUser } from "@/components/context/UserContext";

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

// Helper function to format header names
function formatHeader(header: string): string {
  return header
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // Add space between camel case
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
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
      <div className="overflow-x-auto rounded-lg border border-zinc-300">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80">
                Title
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Type
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Expiration
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Unit type
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Qty/Unit
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Donor Name
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Category
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Quantity
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Date Posted
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Lot Number
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Pallet
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Box Number
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Unit Price
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Max Limit
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                NDC
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Visibility
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                Allocations
              </th>
              <th
                className={
                  "px-4 py-3 text-left font-semibold bg-[#2774ae] text-white opacity-80"
                }
              >
                GIK
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className="odd:bg-zinc-100 border-b border-zinc-300"
              >
                {visibleHeaders.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-4 min-w-32 border-gray-300 font-light text-zinc-800"
                  >
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
                            : header === "expirationDate" ||
                                header === "datePosted"
                              ? formatDate(
                                  item[header as keyof DataItem] as string,
                                ) // Format date fields
                              : (item[header as keyof DataItem] as string)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
