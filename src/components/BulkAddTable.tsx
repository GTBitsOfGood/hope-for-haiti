import { useUser } from "./context/UserContext";

type DataItem = {
  title: string;
  donor_name: string;
  category: string;
  type: string;
  quantity: string;
  expiration: string;
  unit_size: string;
  quantity_per_unit: string;
  lot_number: string;
  pallet_number: string;
  box_number: string;
  unit_price: string;
  visible: string;
  allocatable: string;
  comments: string;
  max_limit_requestable: string;
};

interface DataTableProps {
  data: DataItem[];
}

export default function DataTable({ data }: DataTableProps) {
  const { user } = useUser();
  if (!Array.isArray(data) || data.length === 0) {
    return <div></div>;
  }
  const headers = Object.keys(data[0]);

  // Determine split index for visibility
  const unitSizeIndex = headers.indexOf("unit_size") + 1;
  const visibleHeaders =
    user?.type === "PARTNER" ? headers.slice(0, unitSizeIndex) : headers;

  return (
    <div className="p-4 mt-6 bg-zinc-100 border border-zinc-300 rounded">
      <div className="overflow-x-auto rounded-lg border border-zinc-300">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {visibleHeaders.map((header, index) => (
                <th
                  key={header}
                  className={`px-4 text-left font-semibold ${user?.type !== "PARTNER" && index >= unitSizeIndex ? "bg-black text-white" : "bg-[#2774ae] text-white opacity-80"}`}
                >
                  {header
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </th>
              ))}
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
                    className="px-4 py-2 border-gray-300 font-light text-zinc-800"
                  >
                    <span
                      className={` ${
                        header === "visible"
                          ? item.visible === "TRUE"
                            ? "bg-green-50 px-2 py-1 rounded text-green-700"
                            : "bg-red-50 px-2 py-2 rounded text-red-700"
                          : ""
                      }`}
                    >
                      {header === "visible"
                        ? item.visible === "TRUE"
                          ? "Visible"
                          : "Disabled"
                        : item[header as keyof DataItem]}
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
