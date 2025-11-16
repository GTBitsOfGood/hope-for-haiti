import { useApiClient } from "@/hooks/useApiClient";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import ConfiguredSelect from "../ConfiguredSelect";
import Chip from "./Chip";
import {
  TableAllocation,
  TableDistribution,
  PendingDistributionSearchResult,
} from "@/types/api/distribution.types";

export default function DistributionsGeneralItemChipGroup({
  generalItems,
  allocations,
  fetchTableData,
  pending,
  canTransfer,
  distributionId,
}: {
  generalItems: TableDistribution["generalItems"];
  allocations: TableAllocation[];
  fetchTableData: () => void;
  pending: boolean;
  canTransfer: boolean;
  distributionId: number;
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
          allocations={allocations}
          fetchTableData={fetchTableData}
          pending={pending}
          canTransfer={canTransfer}
          distributionId={distributionId}
        />
      ))}
    </div>
  );
}

function GeneralItemChip({
  generalItem,
  allocations,
  fetchTableData,
  pending,
  canTransfer,
  distributionId,
}: {
  generalItem: TableDistribution["generalItems"][number];
  allocations: TableAllocation[];
  fetchTableData: () => void;
  pending: boolean;
  canTransfer: boolean;
  distributionId: number;
}) {
  const [selectedDistribution, setSelectedDistribution] =
    useState<PendingDistributionSearchResult | null>(null);
  const [selectedLineItems, setSelectedLineItems] = useState<number[]>([]);
  const [pendingDistributions, setPendingDistributions] = useState<
    PendingDistributionSearchResult[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingDistributions, setIsLoadingDistributions] = useState(false);

  const { apiClient } = useApiClient();

  const totalQuantity = generalItem.lineItems.reduce(
    (sum, lineItem) => sum + lineItem.quantity,
    0
  );

  // Fetch pending distributions with debouncing
  const fetchPendingDistributions = useCallback(
    async (term: string) => {
      if (!apiClient) return;

      setIsLoadingDistributions(true);
      try {
        const params = new URLSearchParams();

        if (term.trim()) {
          params.append("term", term.trim());
        }

        // Exclude the current distribution
        params.append("exclude", distributionId.toString());

        const url = `/api/distributions/pending?${params.toString()}`;

        const response = await apiClient.get<{
          distributions: PendingDistributionSearchResult[];
        }>(url);

        setPendingDistributions(response.distributions);
      } catch (error) {
        console.error("Failed to fetch pending distributions:", error);
        toast.error("Failed to load distributions");
      } finally {
        setIsLoadingDistributions(false);
      }
    },
    [apiClient, distributionId]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPendingDistributions(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchPendingDistributions]);

  // Initial load
  useEffect(() => {
    if (apiClient && canTransfer && pending) {
      fetchPendingDistributions("");
    }
  }, [apiClient, canTransfer, pending, fetchPendingDistributions]);

  function formatDistributionLabel(
    distribution: PendingDistributionSearchResult
  ): string {
    const date = new Date(distribution.createdAt);
    if (isNaN(date.getTime())) {
      return `${distribution.partner.name} (Unknown Date)`;
    }
    const formattedDate = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${distribution.partner.name} (${formattedDate})`;
  }

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

    const promise = apiClient.patch(
      `/api/distributions/${selectedDistribution.id}/allocations/batch?transfer=true`,
      {
        body: JSON.stringify({
          allocations: allocationIds.map((id) => ({ id })),
          distributionId: selectedDistribution.id,
          partnerId: selectedDistribution.partner.id,
        }),
      }
    );

    toast.promise(promise, {
      loading: "Transferring line items...",
      success: "Line items transferred!",
      error: "Failed to transfer line items.",
    });

    await promise;

    setSelectedDistribution(null);
    setSelectedLineItems([]);

    fetchTableData();
  }

  return (
    <Chip
      title={generalItem.title}
      amount={totalQuantity}
      revisedAmount={totalQuantity}
      popover={
        pending &&
        canTransfer && (
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
                      label: formatDistributionLabel(selectedDistribution),
                    }
                  : null
              }
              onChange={(newVal) =>
                setSelectedDistribution(newVal?.value ?? null)
              }
              onInputChange={(value) => setSearchTerm(value)}
              options={pendingDistributions.map((distribution) => ({
                value: distribution,
                label: formatDistributionLabel(distribution),
              }))}
              isClearable
              isLoading={isLoadingDistributions}
              placeholder="Search distributions by partner name..."
              noOptionsMessage={() =>
                searchTerm
                  ? `No pending distributions found for "${searchTerm}"`
                  : "No pending distributions available"
              }
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
        )
      }
    />
  );
}
