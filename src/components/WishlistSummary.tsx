"use client";

import { useApiClient } from "@/hooks/useApiClient";
import { useEffect, useState } from "react";

export default function WishlistSummary() {
  const { apiClient } = useApiClient();
  const [text, setText] = useState<string>();

  useEffect(() => {
    apiClient
      .get<{ summary: string }>("api/wishlists/summarize")
      .then(({ summary }) => {
        // Typewriter text effect
        let index = 0;
        const interval = setInterval(() => {
          setText(summary.slice(0, index + 1));
          index++;
          if (index >= summary.length) {
            clearInterval(interval);
          }
        }, 20);
      });
  }, [apiClient]);

  if (!text) {
    return null;
  }

  return (
    <div className="m-2 p-4 rounded border border-red-primary h-auto transition-height duration-100">
      {text}
    </div>
  );
}
