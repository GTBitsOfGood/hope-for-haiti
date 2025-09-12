"use client";

import BaseTable, { extendTableHeader } from "@/components/BaseTable";
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
      headers={[
        extendTableHeader("Distribution date", "min-w-fit w-1/2"),
        extendTableHeader("Number of items in distribution", "min-w-fit w-1/2"),
      ]}
      rows={entries.map((entry) => ({
        cells: [entry.distributionDate, entry.numberOfItems],
        onClick: () => {
          router.push(`/distributions/view/${entry.signOffId}`);
        },
      }))}
      pageSize={10}
      headerClassName="bg-blue-primary opacity-80 text-white"
    />
  );
}
