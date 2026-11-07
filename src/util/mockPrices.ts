import { AllocationTableItem } from "@/components/allocationTable/types";

// TEMP (#387): no backend price data exists yet for allocation items. These
// values are deterministic placeholders (seeded from the item id) so the
// price/value columns and "Value at Finalize" total have something to show
// until the backend ticket lands real donor/saved prices. Delete this file
// and replace with real fields once available.

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function getMockPriceInfo(item: AllocationTableItem): {
  donorPrice: number;
  savedPrice: number | null;
} {
  const donorPrice = 5 + ((item.id * 37) % 95);
  const hasSavedPrice = item.id % 3 !== 0;
  const savedPrice = hasSavedPrice
    ? Math.max(1, donorPrice - ((item.id * 13) % 20))
    : null;

  return { donorPrice, savedPrice };
}
