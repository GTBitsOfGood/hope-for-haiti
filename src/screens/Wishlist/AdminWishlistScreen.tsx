"use client";

import { useFetch } from "@/hooks/useFetch";
import { WishlistAggregate } from "@/types/api/wishlist.types";
import BaseTable from "@/components/baseTable/BaseTable";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AdminWishlistScreen() {
  const router = useRouter();
  const { data } = useFetch<WishlistAggregate[]>("/api/wishlists", {
    cache: "no-store",
    onError: (error: unknown) => {
      toast.error((error as Error).message);
    },
  });

  return (
    <div className="pb-32">
      <h1 className="text-2xl font-bold text-gray-primary">Wishlists</h1>

      <BaseTable
        headers={["Partner", "Total", "Low", "Medium", "High"]}
        rows={
          data?.map((r) => ({
            cells: [
              r.partnerName,
              r.totalCount,
              r.lowCount,
              r.mediumCount,
              r.highCount,
            ],
            onClick: () => router.push(`/wishlists/${r.partnerId}`),
          })) || []
        }
      />
    </div>
  );
}
