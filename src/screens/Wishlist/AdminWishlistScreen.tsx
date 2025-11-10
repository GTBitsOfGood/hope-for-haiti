"use client";

import { User, Wishlist } from "@prisma/client";
import AdvancedBaseTable, {
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import { useApiClient } from "@/hooks/useApiClient";
import { useCallback } from "react";
import WishlistSummary from "@/components/WishlistSummary";
import { ChatTeardropText } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

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
      <WishlistSummary />

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
            cell: (wishlist) => (
              <div className="w-1/3 flex items-center justify-center">
                <ChatTeardropText
                  size={22}
                  className={wishlist.comments ? "text-black" : "text-gray-300"}
                  data-tooltip-id={`wishlist-comment-${wishlist.id}`}
                  data-tooltip-content={
                    wishlist.comments ? wishlist.comments : "(no comment)"
                  }
                />
                {wishlist.comments && (
                  <Tooltip
                    id={`wishlist-comment-${wishlist.id}`}
                    className="max-w-64 whitespace-pre-wrap"
                  />
                )}
              </div>
            ),
          },
        ]}
        fetchFn={fetch}
        rowId={(wishlist: Wishlist) => wishlist.id}
      />
    </div>
  );
}
