"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import AllocationTable from "@/components/allocationTable/AllocationTable";
import {
  AllocationChange,
  AllocationTableItem,
} from "@/components/allocationTable/types";
import type { FilterList } from "@/components/baseTable/AdvancedBaseTable";
import type { PartnerDistributionSummary } from "@/components/LineItemChipGroup";
import { useApiClient } from "@/hooks/useApiClient";
import { useFetch } from "@/hooks/useFetch";
import { formatTableValue } from "@/utils/format";

type AllocationResponse = {
  items: AllocationTableItem[];
  total: number;
};

type SuggestionResponse = {
  allocations: { lineItemId: number; partnerId: number | null }[];
};

function calculateItemsAllocated(
  item: AllocationTableItem,
  request: AllocationTableItem["requests"][number]
) {
  return item.items
    .filter((line) => line.allocation?.partner?.id === request.partnerId)
    .reduce((sum, line) => sum + line.quantity, 0);
}

export default function AdminAllocateDonorOfferScreen() {
  const { apiClient } = useApiClient();
  const params = useParams<{ donorOfferId: string }>();
  const donorOfferId = Number(params?.donorOfferId);
  const isValidDonorOfferId = Number.isFinite(donorOfferId);

  const [distributionsByPartner, setDistributionsByPartner] = useState<
    Record<number, PartnerDistributionSummary[]>
  >({});

  const { refetch: refetchDistributions } = useFetch<{
    distributions: Record<number, PartnerDistributionSummary[]>;
  }>(`/api/donorOffers/${donorOfferId}/distributions`, {
    conditionalFetch: isValidDonorOfferId,
    onSuccess: (data) => {
      if (!data?.distributions) {
        setDistributionsByPartner({});
        return;
      }

      const normalized = Object.entries(data.distributions).reduce(
        (acc, [partnerKey, distributions]) => {
          const partnerId = Number(partnerKey);
          acc[partnerId] = distributions.map((distribution) => ({
            ...distribution,
            partnerId,
          }));
          return acc;
        },
        {} as Record<number, PartnerDistributionSummary[]>
      );

      setDistributionsByPartner(normalized);
    },
  });

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AllocationTableItem>
    ) => {
      void pageSize;
      void page;
      void filters;

      if (!isValidDonorOfferId) {
        return { data: [], total: 0 };
      }

      const response = await apiClient.get<AllocationResponse>(
        `/api/donorOffers/${donorOfferId}/allocationItems`,
        { cache: "no-store" }
      );

      const items = response.items.map((item) => ({
        ...item,
        requests: item.requests.map((request) => ({
          ...request,
          itemsAllocated: calculateItemsAllocated(item, request),
        })),
      }));

      return {
        data: items,
        total: items.length,
      };
    },
    [apiClient, donorOfferId, isValidDonorOfferId]
  );

  const ensureDistributionForPartner = useCallback(
    async (partnerId: number, partnerName: string) => {
      const existingPending =
        distributionsByPartner[partnerId]?.find(
          (distribution) => distribution.pending
        ) ?? null;
      if (existingPending) {
        return existingPending;
      }

      const body = new FormData();
      body.set("partnerId", partnerId.toString());
      body.set("pending", "true");

      const distribution = await apiClient.post<{
        id: number;
        partnerId: number;
        pending: boolean;
      }>("/api/distributions", {
        body,
      });

      const summary: PartnerDistributionSummary = {
        id: distribution.id,
        partnerId: distribution.partnerId,
        partnerName,
        pending: distribution.pending,
      };

      setDistributionsByPartner((prev) => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] ?? []), summary],
      }));

      return summary;
    },
    [apiClient, distributionsByPartner]
  );

  const handleDistributionRemoved = useCallback((partnerId: number) => {
    setDistributionsByPartner((prev) => {
      if (!(partnerId in prev)) {
        return prev;
      }

      const updated = { ...prev };
      delete updated[partnerId];
      return updated;
    });
  }, []);

  const handleSuggestAllocations = useCallback(
    async (items: AllocationTableItem[]) => {
      void items;

      if (!isValidDonorOfferId) {
        toast.error("Invalid donor offer identifier");
        return { allocations: [] };
      }

      return apiClient.post<SuggestionResponse>("/api/suggest/allocations", {
        body: JSON.stringify({ donorOfferId }),
      });
    },
    [apiClient, donorOfferId, isValidDonorOfferId]
  );

  const handleApplySuggestions = useCallback(
    async (changes: AllocationChange[]) => {
      let appliedCount = 0;

      const removals: { allocationId: number; partnerId: number }[] = [];
      const additionsByDistribution = new Map<
        number,
        { partnerId: number; lineItemId: number }[]
      >();

      for (const change of changes) {
        const previousPartnerId = change.previousPartner?.id ?? null;
        const nextPartnerId = change.nextPartner?.id ?? null;

        if (previousPartnerId === nextPartnerId) {
          continue;
        }

        if (change.previousAllocationId && previousPartnerId !== null) {
          removals.push({
            allocationId: change.previousAllocationId,
            partnerId: previousPartnerId,
          });
        }

        if (nextPartnerId === null) {
          appliedCount += 1;
          continue;
        }

        const partnerName =
          change.nextPartner?.name ?? `Partner ${nextPartnerId}`;

        const distribution = await ensureDistributionForPartner(
          nextPartnerId,
          partnerName
        );

        const entry = additionsByDistribution.get(distribution.id) ?? [];
        entry.push({
          partnerId: nextPartnerId,
          lineItemId: change.lineItemId,
        });
        additionsByDistribution.set(distribution.id, entry);
      }

      await Promise.all(
        removals.map(async ({ allocationId, partnerId }) => {
          const response = await apiClient.delete<{
            deletedDistribution: boolean;
          }>(`/api/allocations/${allocationId}`);

          if (response.deletedDistribution) {
            handleDistributionRemoved(partnerId);
          }
        })
      );
      appliedCount += removals.length;

      const additionCounts = await Promise.all(
        Array.from(additionsByDistribution.entries()).map(
          async ([distributionId, allocations]) => {
            if (!allocations.length) {
              return 0;
            }

            await apiClient.post(
              `/api/distributions/${distributionId}/allocations/batch`,
              {
                body: JSON.stringify({ allocations }),
              }
            );

            return allocations.length;
          }
        )
      );
      appliedCount += additionCounts.reduce((sum, count) => sum + count, 0);

      return appliedCount;
    },
    [apiClient, ensureDistributionForPartner, handleDistributionRemoved]
  );

  return (
    <>
      <div className="flex flex-row justify-between items-center mb-4">
        <div className="flex items-center gap-1">
          <Link
            href="/donorOffers"
            className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1"
          >
            Donor Offers
          </Link>
          <span className="text-gray-500 text-sm flex items-center">/</span>
          <span className="font-medium hover:bg-gray-100 transition-colors rounded cursor-pointer flex items-center justify-center p-1">
            {formatTableValue(String(donorOfferId))}
          </span>
        </div>
      </div>

      <AllocationTable
        fetchFn={fetchTableData}
        ensureDistributionForPartner={ensureDistributionForPartner}
        onDistributionRemoved={handleDistributionRemoved}
        suggestionConfig={{
          onSuggest: handleSuggestAllocations,
          onApply: handleApplySuggestions,
          onAfterApply: () => {
            refetchDistributions();
          },
        }}
      />
    </>
  );
}
