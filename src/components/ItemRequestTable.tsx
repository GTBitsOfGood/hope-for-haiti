import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import MultiSelectDropdown from "./MultiSelectDropdown";

export default function ItemRequestTable({
  generalItemData,
}: {
  generalItemData: UnallocatedItemData;
}) {
  const headerClassName =
    "text-left bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10";

  const rowCellClassName = "text-gray-primary/90";

  const { requests, items: lineItems } = generalItemData;

  const unallocatedLineItems = lineItems.filter((item) => !item.allocationId);

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className={headerClassName}>Partner</th>
          <th className={headerClassName}>Requested On</th>
          <th className={headerClassName}>Quantity</th>
          <th className={headerClassName}>Priority</th>
          <th className={headerClassName}>Comments</th>
          <th className={headerClassName}>
            {/* Allocate Items (no header) */}
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {requests.map((request) => (
          <tr key={request.id}>
            <td className={rowCellClassName}>{request.partner.name}</td>
            <td className={rowCellClassName}>
              {new Date(request.createdAt).toLocaleDateString()}
            </td>
            <td className={rowCellClassName}>{request.quantity}</td>
            <td className={rowCellClassName}>{request.priority ?? "N/A"}</td>
            <td className={rowCellClassName}>{request.comments ?? "N/A"}</td>
            <td className={rowCellClassName}>
              {unallocatedLineItems.length === 0 ? (
                "No available line items"
              ) : (
                <MultiSelectDropdown
                  label="Allocate Items"
                  options={unallocatedLineItems.map((item) => ({
                    id: item.id,
                    label: `${generalItemData.title} x${item.quantity}`,
                  }))}
                  onChange={(items) => {
                    console.log("Selected items for allocation:", items);
                  }}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
