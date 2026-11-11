import { centsToMoneyString, moneyStringToCents } from "@/util/priceCheck";

export type AllocationValueLine = {
  quantity: number;
  savedUnitPrice: string | null;
  partner: { id: number; name: string } | null;
};

export type AllocationValueBucket = {
  value: string;
  unpricedCount: number;
};

export type AllocationValuePartner = AllocationValueBucket & {
  partnerId: number;
  partnerName: string;
};

export type AllocationValueSummary = {
  partners: AllocationValuePartner[];
  notAllocated: AllocationValueBucket;
  total: string;
  unpricedCount: number;
  hasSavedPrices: boolean;
};

type MutableBucket = {
  cents: bigint;
  unpricedCount: number;
};

function emptyBucket(): MutableBucket {
  return { cents: BigInt(0), unpricedCount: 0 };
}

function toBucket(bucket: MutableBucket): AllocationValueBucket {
  return {
    value: centsToMoneyString(bucket.cents),
    unpricedCount: bucket.unpricedCount,
  };
}

/**
 * Sum each line's saved price × quantity by allocated partner.
 * Lines with no savedUnitPrice are flagged and never counted as $0.00.
 */
export function buildAllocationValueSummary(
  lines: AllocationValueLine[]
): AllocationValueSummary {
  const partners = new Map<
    number,
    MutableBucket & { partnerName: string }
  >();
  const notAllocated = emptyBucket();
  let totalCents = BigInt(0);
  let unpricedCount = 0;
  let hasSavedPrices = false;

  for (const line of lines) {
    if (line.savedUnitPrice != null) {
      hasSavedPrices = true;
      const lineCents =
        moneyStringToCents(line.savedUnitPrice) * BigInt(line.quantity);
      totalCents += lineCents;

      if (line.partner) {
        const existing = partners.get(line.partner.id) ?? {
          ...emptyBucket(),
          partnerName: line.partner.name,
        };
        existing.cents += lineCents;
        existing.partnerName = line.partner.name;
        partners.set(line.partner.id, existing);
      } else {
        notAllocated.cents += lineCents;
      }
      continue;
    }

    unpricedCount += 1;
    if (line.partner) {
      const existing = partners.get(line.partner.id) ?? {
        ...emptyBucket(),
        partnerName: line.partner.name,
      };
      existing.unpricedCount += 1;
      existing.partnerName = line.partner.name;
      partners.set(line.partner.id, existing);
    } else {
      notAllocated.unpricedCount += 1;
    }
  }

  return {
    partners: [...partners.entries()]
      .map(([partnerId, bucket]) => ({
        partnerId,
        partnerName: bucket.partnerName,
        ...toBucket(bucket),
      }))
      .sort((a, b) => a.partnerName.localeCompare(b.partnerName)),
    notAllocated: toBucket(notAllocated),
    total: centsToMoneyString(totalCents),
    unpricedCount,
    hasSavedPrices,
  };
}
