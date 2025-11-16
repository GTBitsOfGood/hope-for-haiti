import { useApiClient } from "@/hooks/useApiClient";
import { useState } from "react";
import toast from "react-hot-toast";
import ConfiguredSelect from "../ConfiguredSelect";
import Chip from "./Chip";
import {
  TableAllocation,
  TableDistribution,
} from "@/types/api/distribution.types";

export default function DistributionsGeneralItemChipGroup({
  generalItems,
  otherDistributions,
  allocations,
  fetchTableData,
  pending,
  canTransfer,
}: {
  generalItems: TableDistribution["generalItems"];
  otherDistributions: TableDistribution[];
  allocations: TableAllocation[];
  fetchTableData: () => void;
  pending: boolean;
  canTransfer: boolean;
}) {
  return (
    <div className="w-full bg-sunken flex flex-wrap p-2">
      {generalItems.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No general items.
        </p>
      )}
      {generalItems.map((item) => (
        <GeneralItemChip
          key={item.id}
          generalItem={item}
          otherDistributions={otherDistributions}
          allocations={allocations}
          fetchTableData={fetchTableData}
          pending={pending}
          canTransfer={canTransfer}
        />
      ))}
    </div>
  );
}

function GeneralItemChip({
  generalItem,
  otherDistributions,
  allocations,
  fetchTableData,
  pending,
  canTransfer,
}: {
  generalItem: TableDistribution["generalItems"][number];
  otherDistributions: TableDistribution[];
  allocations: TableAllocation[];
  fetchTableData: () => void;
  pending: boolean;
  canTransfer: boolean;
}) {
  const [selectedDistribution, setSelectedDistribution] = useState<number>();
  const [selectedLineItems, setSelectedLineItems] = useState<number[]>([]);

  const { apiClient } = useApiClient();

  function lineItemLabel(
    lineItem: TableDistribution["generalItems"][number]["lineItems"][number]
  ) {
    return `${generalItem.title} x${lineItem.quantity}`;
  }

  async function transferLineItems() {
    if (!selectedDistribution) {
      toast.error("Please select a distribution to transfer to.");
      return;
    }

    if (selectedLineItems.length === 0) {
      toast.error("Please select at least one line item to transfer.");
      return;
    }

    const allocationIds = allocations
      .filter((allocation) => selectedLineItems.includes(allocation.lineItemId))
      .map((allocation) => allocation.id);

    const distribution = otherDistributions.find(
      (d) => d.id === selectedDistribution
    );

    if (!distribution) {
      toast.error("Selected distribution not found.");
      return;
    }

    const promise = apiClient.patch(
      `/api/distributions/${distribution.id}/allocations/batch?transfer=true`,
      {
        body: JSON.stringify({
          allocations: allocationIds.map((id) => ({ id })),
          distributionId: selectedDistribution,
          partnerId: distribution.partner.id,
        }),
      }
    );

    toast.promise(promise, {
      loading: "Transferring line items...",
      success: "Line items transferred!",
      error: "Failed to transfer line items.",
    });

    await promise;

    setSelectedDistribution(undefined);
    setSelectedLineItems([]);

    fetchTableData();
  }

  return (
    <Chip
      title={generalItem.title}
      popover={
        pending && canTransfer &&
        <div className="flex flex-col gap-2">
          <p className="text-gray-primary font-bold mb-1">Transfer Item</p>
          <p className="text-sm text-gray-primary font-normal">
            Select Distribution
          </p>
          <ConfiguredSelect
            value={
              selectedDistribution
                ? {
                    value: selectedDistribution,
                    label:
                      otherDistributions.find(
                        (d) => d.id === selectedDistribution
                      )
                        ? (() => {
                            const dist = otherDistributions.find((d) => d.id === selectedDistribution)!;
                            const donors = Array.from(new Set(dist.generalItems.map(gi => gi.donorOffer.donorName))).join(", ");
                            return `${dist.partner.name} (${donors})`;
                          })()
                        : "",
                  }
                : undefined
            }
            onChange={(newVal) => setSelectedDistribution(newVal?.value)}
            options={otherDistributions.map((distribution) => {
              const donors = Array.from(new Set(distribution.generalItems.map(gi => gi.donorOffer.donorName))).join(", ");
              return {
                value: distribution.id,
                label: `${distribution.partner.name} (${donors})`,
              };
            })}
            isClearable
            placeholder="Choose distribution..."
          />
          <p className="text-sm text-gray-primary font-normal">
            Select Line Items
          </p>
          <ConfiguredSelect
            value={selectedLineItems.map((id) => ({
              value: id,
              label: lineItemLabel(
                generalItem.lineItems.find((li) => li.id === id)!
              ),
            }))}
            onChange={(newVal) =>
              setSelectedLineItems(newVal.map((item) => item.value))
            }
            options={generalItem.lineItems.map((lineItem) => ({
              value: lineItem.id,
              label: lineItemLabel(lineItem),
            }))}
            isClearable
            isMulti
            placeholder="Choose line items..."
          />
          <div className="w-full flex justify-end">
            <button
              onClick={transferLineItems}
              className="rounded bg-blue-primary text-white px-3 py-1"
            >
              Transfer
            </button>
          </div>
        </div>
      }
    />
  );

}
