"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NewDonorOfferAllocationModal from "@/components/NewDonorOfferAllocationModal";
import { useFetch } from "@/hooks/useFetch";

interface SearchResults {
  donorNames: string[];
  lotNumbers: number[];
  palletNumbers: number[];
  boxNumbers: number[];
}

export default function NewDonorOfferAllocationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const allocationParams = {
    donorOfferItemRequestId: searchParams.get("donorOfferItemRequestId"),
    title: searchParams.get("title"),
    type: searchParams.get("type"),
    expirationDate: searchParams.get("expirationDate"),
    unitType: searchParams.get("unitType"),
    quantityPerUnit: searchParams.get("quantityPerUnit"),
  };

  const hasRequiredParams = Object.values(allocationParams).every(param => param !== null);

  const searchParamsForUrl = hasRequiredParams ? {
    title: allocationParams.title!,
    type: allocationParams.type!,
    unitType: allocationParams.unitType!,
    quantityPerUnit: allocationParams.quantityPerUnit!,
    ...(allocationParams.expirationDate && { 
      expirationDate: allocationParams.expirationDate 
    }),
  } : null;

  const { data: searchResults, isLoading } = useFetch<SearchResults>(
    `/api/allocations/itemSearch${
      searchParamsForUrl 
        ? `?${new URLSearchParams(searchParamsForUrl).toString()}`
        : ""
    }`,
    {
      conditionalFetch: hasRequiredParams,
      onError: (error) => {
        console.error("Failed itemSearch request:", error);
      },
    }
  );

  if (!hasRequiredParams) {
    return <p className="p-4">Missing required query params.</p>;
  }

  if (isLoading) {
    return <p className="p-4">Loading possible donors/lots/pallets/boxes...</p>;
  }

  const defaultSearchResults: SearchResults = {
    donorNames: [],
    lotNumbers: [],
    palletNumbers: [],
    boxNumbers: [],
  };

  return (
    <NewDonorOfferAllocationModal
      onClose={() => router.back()}
      donorOfferItemRequestId={allocationParams.donorOfferItemRequestId!}
      title={allocationParams.title!}
      type={allocationParams.type!}
      expirationDate={allocationParams.expirationDate!}
      unitType={allocationParams.unitType!}
      quantityPerUnit={parseInt(allocationParams.quantityPerUnit!)}
      searchResults={searchResults || defaultSearchResults}
    />
  );
}
