"use client";

import { User, Wishlist } from "@prisma/client";
import AdvancedBaseTable, {
  FilterList,
} from "@/components/baseTable/AdvancedBaseTable";
import { useApiClient } from "@/hooks/useApiClient";
import { useCallback, useState } from "react";
import WishlistSummary from "@/components/WishlistSummary";
import { ChatTeardropText, Question } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import PriorityTag from "@/components/tags/PriorityTag";

export default function AdminWishlistScreen() {
  const { apiClient } = useApiClient();
  const [totalItems, setTotalItems] = useState<number | null>(null);

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

      const response = await apiClient.get<{
        wishlists: (Wishlist & { partner: User })[];
        total: number;
      }>(`/api/wishlists?${searchParams}`);
      setTotalItems(response.total);

      return {
        data: response.wishlists,
        total: response.total,
      };
    },
    [apiClient]
  );

  return (
    <div className="pb-32">
      <h1 className="text-2xl font-bold text-gray-primary">Wishlists</h1>

      {totalItems !== null && totalItems >= 10 ? <WishlistSummary/> :
        <div className="flex justify-end -mb-10 mt-8 mr-28">
          <Question 
            size={20} 
            className="text-gray-primary/60 cursor-help"
            data-tooltip-id="wishlist-ai-info"
            data-tooltip-content="AI Wishlist Summary is available when Wishlist contains 10 or more entries"
          />
          <Tooltip 
            id="wishlist-ai-info" 
            className="z-50 max-w-xs" 
          />
        </div>
      }      
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
            cell: (wishlist) => <PriorityTag priority={wishlist.priority} />,
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
                  className={
                    wishlist.comments ? "text-black" : "text-gray-primary/50"
                  }
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
