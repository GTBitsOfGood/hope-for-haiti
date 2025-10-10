import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { useState } from "react";

export default function ItemRequestTable({
  generalItemData,
}: {
  generalItemData: UnallocatedItemData;
}) {
  const headerClassName =
    "text-left bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10";

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
          <ItemRequestTableRow
            key={request.id}
            request={request}
            unallocatedLineItems={unallocatedLineItems}
            generalItemData={generalItemData}
          />
        ))}
      </tbody>
    </table>
  );
}

function ItemRequestTableRow({
  generalItemData,
  request,
  unallocatedLineItems,
}: {
  generalItemData: UnallocatedItemData;
  request: UnallocatedItemData["requests"][number];
  unallocatedLineItems: UnallocatedItemData["items"];
}) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <tr>
      <td>{request.partner.name}</td>
      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
      <td>{request.quantity}</td>
      <td>{request.priority ?? "N/A"}</td>
      <td>{request.comments ?? "N/A"}</td>
      <td>
        {unallocatedLineItems.length === 0 ? (
          "No available line items"
        ) : (
          <MultiSelectDropdown
            label="Allocate Items"
            options={unallocatedLineItems.map((item) => ({
              id: item.id,
              label: `${generalItemData.title} x${item.quantity}`,
            }))}
            selectedValues={selectedItems}
            onChange={toggleItemSelection}
          />
        )}
      </td>
    </tr>
  );
}
