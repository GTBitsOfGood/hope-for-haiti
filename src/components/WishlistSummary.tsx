import { useFetch } from "@/hooks/useFetch";
import { useEffect, useState } from "react";

export default function WishlistSummary() {
  const { data } = useFetch<{ summary: string }>("/api/wishlists/summarize");
  const [text, setText] = useState("Loading summary...");

  useEffect(() => {
    if (data?.summary) {
      // Typewriter text effect
      let index = 0;
      const interval = setInterval(() => {
        setText(data.summary.slice(0, index + 1));
        index++;
        if (index >= data.summary.length) {
          clearInterval(interval);
        }
      }, 20);
    }
  }, [data]);

  return (
    <div className="m-2 p-4 rounded border border-red-primary">{text}</div>
  );
}
