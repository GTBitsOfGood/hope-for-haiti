"use client";

import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { WishlistAggregate } from "@/types/api/wishlist.types";
import BaseTable from "@/components/baseTable/BaseTable";
import toast from "react-hot-toast";

export default function AdminWishlistScreen() {
  const { data } = useFetch<WishlistAggregate[]>("/api/wishlists", {
    cache: "no-store",
    onError: (error: unknown) => {
      toast.error((error as Error).message);
    },
  });

  return (
    <div className="pb-32">
      <h1 className="text-2xl font-bold text-red-primary">Wishlists</h1>

      <BaseTable
        headers={["Partner", "Total", "Low", "Medium", "High"]}
        rows={
          data?.map((r) => ({
            cells: [
              <Link
                key={`partner-${r.partnerId}`}
                className="text-blue-primary underline"
                href={`/wishlists/${r.partnerId}`}
              >
                {r.partnerName}
              </Link>,
              r.totalCount,
              r.lowCount,
              r.mediumCount,
              r.highCount,
            ],
          })) || []
        }
      />
    </div>
  );
}
