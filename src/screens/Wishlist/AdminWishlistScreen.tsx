"use client";

import { User, Wishlist } from "@prisma/client";
import AdvancedBaseTable, {
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import { useApiClient } from "@/hooks/useApiClient";
import { useCallback } from "react";

export default function AdminWishlistScreen() {
  const { apiClient } = useApiClient();

  const fetch = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<Wishlist & { partner: User }>
    ) => {
      const searchParams = new URLSearchParams();
      searchParams.append("pageSize", pageSize.toString());
      searchParams.append("page", page.toString());
      searchParams.append("filters", JSON.stringify(filters));

      const response = await apiClient.get<(Wishlist & { partner: User })[]>(
        `/api/wishlists?${searchParams}`
      );

      return {
        data: response,
        total: response.length,
      };
    },
    [apiClient]
  );

  return (
    <div className="pb-32">
      <h1 className="text-2xl font-bold text-gray-primary">Wishlists</h1>

      <AdvancedBaseTable
        columns={[
          {
            header: "Name",
            id: "name",
            cell: (wishlist) => wishlist.name,
          },
          {
            header: "Partner",
            id: "partner",
            cell: (wishlist) => wishlist.partner.name,
          },
          {
            header: "Priority",
            id: "priority",
            cell: (wishlist) => wishlist.priority,
          },
          {
            header: "Quantity",
            id: "quantity",
            cell: (wishlist) => wishlist.quantity,
          },
          {
            header: "Comments",
            id: "comments",
            cell: (wishlist) => wishlist.comments || "",
          },
        ]}
        fetchFn={fetch}
        rowId={(wishlist: Wishlist) => wishlist.id}
      />
    </div>
  );
}
