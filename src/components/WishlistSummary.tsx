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
    // I don't like hardcoding the height, but I couldn't find a better way to animate height based on content.
    // Other approaches animated the initial box appearance, but wouldn't animate when the text wrapped to a new line.
    <div
      className={`${text ? "min-h-4 p-4 rounded border border-blue-primary bg-blue-light" : "h-0"} transition-all duration-200`}
    >
      {text}
    </div>
  );
}
