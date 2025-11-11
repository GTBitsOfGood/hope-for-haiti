"use client";

import { useFetch } from "@/hooks/useFetch";
import { useEffect, useState } from "react";

export default function WishlistSummary() {
  const { data } = useFetch<{ summary: string }>("/api/wishlists/summary");
  const [text, setText] = useState<string>("Loading wishlist summary...");

  useEffect(() => {
    if (data?.summary === "") {
      setText("No summary available.");
      return;
    }

    if (!data?.summary) {
      return;
    }

    // Typewriter text effect
    let index = 0;
    const interval = setInterval(() => {
      setText(data.summary.slice(0, index + 1));
      index++;
      if (index >= data.summary.length) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [data]);

  return (
    <div
      className={`${text ? "min-h-4 p-4 rounded border border-blue-primary bg-blue-light" : "h-0"} transition-all duration-200`}
    >
      {text}
    </div>
  );
}
