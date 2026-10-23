"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { PreviewTable, PriceCheckSummary, PriceCheckStepperModal } from "@/components/DonorOffers";
import { priceCheckFixture } from "@/components/DonorOffers/priceCheckFixtures";
import type { PriceCheckedItem } from "@/types/api/donorOffer.types";
import { isBlockingStatus } from "@/util/priceCheck";

// Permanent sandbox: renders the price-check screen's components against
// fixture data (src/components/DonorOffers/priceCheckFixtures.ts), so every
// status/badge/layout is visible without a real upload or donor offer.
// The stepper modal below does call the real /api/itemPrices endpoints
// (there's nothing to fake there — it's existing, already-shipped API).
// Independent of backend readiness — 404s outside development so it's never
// reachable in production.
export default function PriceCheckPreviewHarness() {
  if (process.env.NODE_ENV === "production") notFound();

  const [stepperItems, setStepperItems] = useState<PriceCheckedItem[] | null>(null);

  const data = priceCheckFixture.map((item) => ({
    title: item.title,
    row: item.row,
    priceCheck: item.priceCheck,
    unitType: "case",
    quantity: 10,
    unitPrice: 20,
  }));

  const blocking = priceCheckFixture.filter((item) => isBlockingStatus(item.priceCheck.status));

  return (
    <main className="px-10 py-5">
      <h1 className="text-2xl font-semibold text-gray-primary">
        Price check preview (dev harness)
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Renders the price-check UI against fixture data covering all five
        statuses. See src/components/DonorOffers/priceCheckFixtures.ts.
      </p>
      <PriceCheckSummary items={priceCheckFixture} />
      <button
        type="button"
        onClick={() => setStepperItems(blocking)}
        className="mt-3 bg-red-500 hover:bg-red-700 text-white py-1 px-4 rounded text-sm"
      >
        Add prices
      </button>
      <PreviewTable
        final
        data={data}
        onPriceAction={(item) => item.priceCheck && setStepperItems([{ row: item.row ?? 0, title: item.title, priceCheck: item.priceCheck }])}
      />
      {stepperItems && (
        <PriceCheckStepperModal
          items={stepperItems}
          onClose={() => setStepperItems(null)}
          onSaved={() => setStepperItems(null)}
        />
      )}
    </main>
  );
}
