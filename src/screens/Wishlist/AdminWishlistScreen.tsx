"use client";

import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { WishlistAggregate } from "@/types/api/wishlist.types";
import { mockWishlistAggregates } from "@/mock/wishlists";
import { useEffect, useState } from "react";

export default function AdminWishlistScreen() {
  const { data } = useFetch<WishlistAggregate[]>(
    "/api/wishlists",
    {
      cache: "no-store",
      onError: () => {},
    }
  );

  const [rows, setRows] = useState<WishlistAggregate[]>([]);
  useEffect(() => {
    if (data && Array.isArray(data)) setRows(data);
    else setRows(mockWishlistAggregates);
  }, [data]);

  return (
    <div className="pb-32">
      <h1 className="text-2xl font-bold text-red-primary">Wishlists</h1>
      <div className="overflow-x-auto">
        <table className="mt-4 rounded-t-lg min-w-full">
          <thead>
            <tr className="bg-blue-primary opacity-80 text-white border-b-2">
              <th className="px-4 py-2 text-left font-bold">Partner</th>
              <th className="px-4 py-2 text-left font-bold">Total</th>
              <th className="px-4 py-2 text-left font-bold">Low</th>
              <th className="px-4 py-2 text-left font-bold">Medium</th>
              <th className="px-4 py-2 text-left font-bold">High</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.partnerId}
                data-odd={idx % 2 !== 0}
                className="bg-white data-[odd=true]:bg-gray-50 border-b"
              >
                <td className="px-4 py-2">
                  <Link className="text-blue-primary underline" href={`/wishlists/${r.partnerId}`}>
                    {r.partnerName}
                  </Link>
                </td>
                <td className="px-4 py-2">{r.totalCount}</td>
                <td className="px-4 py-2">{r.lowCount}</td>
                <td className="px-4 py-2">{r.medCount}</td>
                <td className="px-4 py-2">{r.highCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
