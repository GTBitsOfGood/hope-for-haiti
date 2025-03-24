"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import NewAllocationModal from "@/components/NewAllocationModal";

export default function NewAllocationPage() {
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
  const unallocatedItemRequestId = searchParams.get("unallocatedItemRequestId");
  const title = searchParams.get("title");
  const type = searchParams.get("type");
  const expiration = searchParams.get("expiration");
  const unitSize = searchParams.get("unitSize");

  useEffect(() => {
    if (
      !unallocatedItemRequestId ||
      !title ||
      !type ||
      !expiration ||
      !unitSize
    ) {
      return;
    }

    const params = new URLSearchParams();
    if (title) params.append("title", title);
    if (type) params.append("type", type);
    if (expiration) params.append("expiration", expiration);
    if (unitSize) params.append("unitSize", unitSize);

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
  }, [unallocatedItemRequestId, title, type, expiration, unitSize]);

  if (
    !unallocatedItemRequestId ||
    !title ||
    !type ||
    !expiration ||
    !unitSize
  ) {
    return <p className="p-4">Missing required query params.</p>;
  }

  if (isLoading) {
    return <p className="p-4">Loading possible donors/lots/pallets/boxes...</p>;
  }

  return (
    <NewAllocationModal
      onClose={() => router.back()}
      unallocatedItemRequestId={unallocatedItemRequestId}
      title={title}
      type={type}
      expiration={expiration}
      unitSize={unitSize}
      searchResults={searchResults}
    />
  );
}
