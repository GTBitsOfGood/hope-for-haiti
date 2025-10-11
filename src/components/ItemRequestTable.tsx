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
  const [allocations, setAllocations] = useState<{
    [itemId: number]: {
      allocationId: number;
      distributionId: number;
    };
  }>({});

  async function allocateItems(lineItemIds: number[]) {
    if (lineItemIds.length === 0) return;

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

    setAllocations((prev) => {
      for (const allocation of data.allocations) {
        prev[allocation.itemId] = {
          allocationId: allocation.id,
          distributionId: allocation.distributionId,
        };
      }
      return { ...prev };
    });
  }

  async function unallocateItems(
    allocationsToDelete: { allocationId: number; distributionId: number }[]
  ) {
    if (allocationsToDelete.length === 0) return;

    const distributionIds = new Set(
      allocationsToDelete.map((a) => a.distributionId)
    );
    if (distributionIds.size > 1) {
      throw new Error(
        "Cannot unallocate items from multiple distributions. This case should not be reached!"
      );
    }

    const response = await fetch(
      `/api/distributions/${distributionIds.values().next().value}/allocations`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allocations: allocationsToDelete.map((a) => a.allocationId),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message);
      throw new Error(data.message);
    }

    console.log("Unallocation successful:", data);
    toast.success("Items unallocated successfully!");

    setAllocations((prev) => {
      for (const { allocationId } of allocationsToDelete) {
        for (const [itemId, alloc] of Object.entries(prev)) {
          if (alloc.allocationId === allocationId) {
            delete prev[parseInt(itemId)];
            break;
          }
        }
      }
      return { ...prev };
    });
  }

  async function onConfirmAllocation(lineItemIds: number[]) {
    setSelectedItems(lineItemIds);

    const itemsToAllocate: number[] = [];
    for (const itemId of lineItemIds) {
      if (!allocations[itemId]) {
        itemsToAllocate.push(itemId);
      }
    }

    allocateItems(itemsToAllocate);

    const allocationsToDelete: {
      allocationId: number;
      distributionId: number;
    }[] = [];
    for (const entry of Object.entries(allocations).map(([id, data]) => ({
      id: parseInt(id),
      ...data,
    }))) {
      if (!lineItemIds.includes(entry.id)) {
        allocationsToDelete.push(entry);
      }
    }

    unallocateItems(allocationsToDelete);
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
              label: `${generalItemData.title} x${item.quantity} (lot ${item.lotNumber ?? "N/A"}, pallet ${item.palletNumber ?? "N/A"}, box ${item.boxNumber ?? "N/A"})`,
            }))}
            defaultSelectedValues={selectedItems}
            onConfirm={onConfirmAllocation}
          />
        )}
      </td>
    </tr>
  );
}
