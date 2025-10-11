import { UnallocatedItemData } from "@/screens/AdminUnallocatedItemsScreen";
import MultiSelectDropdown from "./MultiSelectDropdown";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ItemRequestTable({
  generalItemData,
}: {
  generalItemData: UnallocatedItemData;
}) {
  const headerClassName =
    "text-left bg-gray-primary/5 text-gray-primary/70 border-b-2 border-gray-primary/10";

  const { requests, items: lineItems } = generalItemData;

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
            lineItems={lineItems}
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
  lineItems,
}: {
  generalItemData: UnallocatedItemData;
  request: UnallocatedItemData["requests"][number];
  lineItems: UnallocatedItemData["items"];
}) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  async function onConfirmAllocation(lineItemIds: number[]) {
    setSelectedItems(lineItemIds);

    const response = await fetch("/api/allocations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        partnerId: request.partnerId,
        allocations: lineItemIds,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message);
      throw new Error(data.message);
    }

    console.log("Allocation successful:", data);
    toast.success("Items allocated successfully!");
  }

  return (
    <tr>
      <td>{request.partner.name}</td>
      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
      <td>{request.quantity}</td>
      <td>{request.priority ?? "N/A"}</td>
      <td>{request.comments ?? "N/A"}</td>
      <td>
        {lineItems.length === 0 ? (
          "No available line items"
        ) : (
          <MultiSelectDropdown
            label="Allocate Items"
            options={lineItems.map((item) => ({
              id: item.id,
              label: `${generalItemData.title} x${item.quantity}`,
            }))}
            defaultSelectedValues={selectedItems}
            onConfirm={onConfirmAllocation}
          />
        )}
      </td>
    </tr>
  );
}
