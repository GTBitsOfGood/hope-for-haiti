import { useFetch } from "@/hooks/useFetch";

export default function WishlistSummary() {
  const { data } = useFetch<{ summary: string }>("/api/wishlists/summarize");

  if (!data) {
    return <div>Loading summary...</div>;
  }

  return <div>{data.summary || "No summary available"}</div>;
}
