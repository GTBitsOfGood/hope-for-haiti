"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NewDonorOfferAllocationModal from "@/components/NewDonorOfferAllocationModal";

export default function NewDonorOfferAllocationScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<{
    donorNames: string[];
    lotNumbers: number[];
    palletNumbers: number[];
    boxNumbers: number[];
  }>({
    donorNames: [],
    lotNumbers: [],
    palletNumbers: [],
    boxNumbers: [],
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  const donorOfferItemRequestId = searchParams.get("donorOfferItemRequestId");
  const title = searchParams.get("title");
  const type = searchParams.get("type");
  const expirationDate = searchParams.get("expirationDate");
  const unitType = searchParams.get("unitType");
  const quantityPerUnit = searchParams.get("quantityPerUnit");

  useEffect(() => {
    if (
      !donorOfferItemRequestId ||
      !title ||
      !type ||
      !expirationDate ||
      !unitType ||
      !quantityPerUnit
    ) {
      return;
    }

    const params = new URLSearchParams({
      title: title as string,
      type: type as string,
      unitType: unitType as string,
      quantityPerUnit: quantityPerUnit as string,
      ...(expirationDate ? { expirationDate: expirationDate } : {}),
    });

    async function fetchItemSearch() {
      const res = await fetch(
        `/api/allocations/itemSearch?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error(`Failed itemSearch request: ${res.status}`);
      }
      const data = await res.json();
      setSearchResults(data);
      setIsLoading(false);
    }

    fetchItemSearch();
  }, [
    expirationDate,
    quantityPerUnit,
    title,
    type,
    donorOfferItemRequestId,
    unitType,
  ]);

  if (
    !donorOfferItemRequestId ||
    !title ||
    !type ||
    !expirationDate ||
    !unitType ||
    !quantityPerUnit
  ) {
    return <p className="p-4">Missing required query params.</p>;
  }

  if (isLoading) {
    return <p className="p-4">Loading possible donors/lots/pallets/boxes...</p>;
  }

  return (
    <NewDonorOfferAllocationModal
      onClose={() => router.back()}
      donorOfferItemRequestId={donorOfferItemRequestId}
      title={title}
      type={type}
      expirationDate={expirationDate}
      unitType={unitType}
      quantityPerUnit={parseInt(quantityPerUnit)}
      searchResults={searchResults}
    />
  );
}
