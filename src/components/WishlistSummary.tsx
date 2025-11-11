"use client";

import { useFetch } from "@/hooks/useFetch";
import { useEffect, useState } from "react";

/**
 * There's a bug with this in development mode due to React Strict Mode causing double rendering.
 * The bug should not appear in production.
 */
export default function WishlistSummary() {
  const { data } = useFetch<{ summary: string }>("/api/wishlists/summarize");
  const [text, setText] = useState<string>();

  useEffect(() => {
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
      className={`${text ? "min-h-20 p-4 rounded border border-red-primary" : "h-0"} transition-all duration-200`}
    >
      {text}
    </div>
  );
}
