"use client";

import BaseTable from "@/components/baseTable/BaseTable";
import { SignedDistribution } from "@/types/api/distribution.types";
import { useRouter } from "next/navigation";
import React from "react";

interface InProgressTableProps {
  entries: SignedDistribution[];
}

export default function CompleteTable({ entries }: InProgressTableProps) {
  const router = useRouter();
  return (
    <BaseTable
      headers={["Distribution date", "Number of items in distribution"]}
      rows={entries.map((entry) => ({
        cells: [entry.distributionDate, entry.numberOfItems],
        onClick: () => {
          router.push(`/distributions/view/${entry.signOffId}`);
        },
      }))}
      headerCellStyles="min-w-fit w-1/2"
    />
  );
}
