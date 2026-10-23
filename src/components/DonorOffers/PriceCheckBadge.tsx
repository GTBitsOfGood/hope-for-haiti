import type { PriceCheckStatus } from "@/types/api/donorOffer.types";

const STYLES: Record<PriceCheckStatus, { label: string; className: string }> = {
  "no-code": { label: "No code", className: "bg-gray-100 text-gray-700" },
  unreadable: { label: "Unreadable code", className: "bg-yellow-100 text-yellow-800" },
  missing: { label: "Missing price", className: "bg-red-100 text-red-700" },
  // Same amber "needs re-check" styling as the Pricebook page's own badge
  // (PricebookScreen.tsx) so both screens read consistently.
  expired: { label: "Needs re-check", className: "bg-amber-100 text-amber-900" },
  priced: { label: "Priced", className: "bg-green-100 text-green-800" },
};

export default function PriceCheckBadge({ status }: { status: PriceCheckStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={`rounded-full px-2 py-1 text-sm font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}
