"use client";

import { useCallback, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import AllocationTable from "@/components/allocationTable/AllocationTable";
import {
  AllocationChange,
  AllocationTableItem,
  AllocationTableMeta,
} from "@/components/allocationTable/types";
import type { FilterList } from "@/components/baseTable/AdvancedBaseTable";
import type { PartnerDistributionSummary } from "@/components/chips/LineItemChipGroup";
import { useApiClient } from "@/hooks/useApiClient";
import { useFetch } from "@/hooks/useFetch";
import { AllocationSuggestionProgram } from "@/types/ui/allocationSuggestions";
import { DonorOfferHeader } from "@/components/DonorOffers/DonorOfferHeader";

type AllocationResponse = {
  items: AllocationTableItem[];
  total: number;
  orphanedRequests: AllocationTableMeta["orphanedRequests"];
  generalItemOptions: AllocationTableMeta["generalItemOptions"];
};

type SuggestionResponse = {
  programs: AllocationSuggestionProgram[];
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
  const [modifiedPagesCount, setModifiedPagesCount] = useState(0);

  const distributionsRef = useRef<
    Record<number, PartnerDistributionSummary | undefined>
  >({});

  const { refetch: refetchDistributions } = useFetch<{
    distributions: Record<number, PartnerDistributionSummary>;
  }>(`/api/donorOffers/${donorOfferId}/distributions`, {
    conditionalFetch: isValidDonorOfferId,
    onSuccess: (data) => {
      if (!data?.distributions) {
        distributionsRef.current = {};
        return;
      }

      const normalized = Object.entries(data.distributions).reduce(
        (acc, [partnerKey, distribution]) => {
          if (!distribution) {
            return acc;
          }
          const partnerId = Number(partnerKey);
          acc[partnerId] = {
            ...distribution,
            partnerId,
          };
          return acc;
        },
        {} as Record<number, PartnerDistributionSummary>
      );

      distributionsRef.current = normalized;
    },
  });

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<AllocationTableItem>
    ) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });

      if (!isValidDonorOfferId) {
        return { data: [], total: 0 };
      }

      const response = await apiClient.get<AllocationResponse>(
        `/api/donorOffers/${donorOfferId}/allocationItems?${params}`,
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
        total: response.total,
        meta: {
          orphanedRequests: response.orphanedRequests ?? [],
          generalItemOptions: response.generalItemOptions ?? [],
        },
      };
    },
    [apiClient, donorOfferId, isValidDonorOfferId]
  );

  const ensureDistributionForPartner = useCallback(
    async (partnerId: number, partnerName: string) => {
      const existingDistribution = distributionsRef.current[partnerId] ?? null;
      if (existingDistribution) {
        return existingDistribution;
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

      distributionsRef.current = {
        ...distributionsRef.current,
        [partnerId]: summary,
      };

      return summary;
    },
    [apiClient]
  );

  const handleDistributionRemoved = useCallback((partnerId: number) => {
    if (partnerId in distributionsRef.current) {
      const updated = { ...distributionsRef.current };
      delete updated[partnerId];
      distributionsRef.current = updated;
    }
  }, []);

  const handleSuggestAllocations = useCallback(
    async (items: AllocationTableItem[]) => {
      void items;

      if (!isValidDonorOfferId) {
        toast.error("Invalid donor offer identifier");
        return { programs: [] };
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
      <DonorOfferHeader donorOfferId={params.donorOfferId} />

      {modifiedPagesCount > 0 && (
        <div className="mb-4 mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Suggestions have been made across{" "}
            <strong>{modifiedPagesCount}</strong> page
            {modifiedPagesCount === 1 ? "" : "s"}. Please review all pages to
            see all recommendations.
          </p>
        </div>
      )}

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
          onModifiedPagesChange: setModifiedPagesCount,
        }}
      />
    </>
  );
}
