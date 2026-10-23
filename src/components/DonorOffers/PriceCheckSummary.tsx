import type { PriceCheckedItem } from "@/types/api/donorOffer.types";
import { summarize } from "@/util/priceCheck";

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PriceCheckSummary({ items }: { items: PriceCheckedItem[] }) {
  const { valueSoFar, needsPriceCount, warningCount } = summarize(items);

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">Value so far</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{currency(valueSoFar)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">Rows that need a price</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{needsPriceCount}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-600">Rows with warnings</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{warningCount}</p>
      </div>
    </div>
  );
}
