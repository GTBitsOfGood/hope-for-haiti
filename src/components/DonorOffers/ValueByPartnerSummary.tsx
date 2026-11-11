import type { AllocationValueSummary } from "@/util/allocationValue";

function currency(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return `$${value}`;
  }
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function unpricedNote(count: number) {
  if (count <= 0) return null;
  return (
    <span className="text-xs font-medium text-amber-700">
      {count} unpriced
    </span>
  );
}

export default function ValueByPartnerSummary({
  summary,
  savedTotal,
}: {
  summary: AllocationValueSummary | null;
  savedTotal: string | null;
}) {
  if (!summary) {
    return null;
  }

  if (!summary.hasSavedPrices) {
    return (
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Value by partner</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pricing not available for this offer.
        </p>
      </div>
    );
  }

  const offerTotal = savedTotal ?? summary.total;

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Value by partner</h2>
        {summary.unpricedCount > 0 && (
          <p className="text-xs text-amber-700">
            {summary.unpricedCount} item
            {summary.unpricedCount === 1 ? "" : "s"} missing a saved price — not
            included in totals
          </p>
        )}
      </div>

      <dl className="mt-3 space-y-2">
        {summary.partners.map((partner) => (
          <div
            key={partner.partnerId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <dt className="flex min-w-0 items-center gap-2 text-gray-700">
              <span className="truncate">{partner.partnerName}</span>
              {unpricedNote(partner.unpricedCount)}
            </dt>
            <dd className="shrink-0 font-medium text-gray-900">
              {currency(partner.value)}
            </dd>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 text-sm">
          <dt className="flex items-center gap-2 text-gray-700">
            <span>Not allocated</span>
            {unpricedNote(summary.notAllocated.unpricedCount)}
          </dt>
          <dd className="shrink-0 font-medium text-gray-900">
            {currency(summary.notAllocated.value)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2 text-sm">
          <dt className="font-semibold text-gray-900">Total</dt>
          <dd className="shrink-0 font-semibold text-gray-900">
            {currency(offerTotal)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
