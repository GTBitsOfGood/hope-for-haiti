import {
  AllocationTableItem,
  AllocationSuggestion,
} from "./types";

function clonePartner(partner: { id: number; name: string } | null) {
  return partner ? { ...partner } : null;
}

export function cloneAllocationItems(
  items: AllocationTableItem[]
): AllocationTableItem[] {
  return items.map((item) => ({
    ...item,
    requests: item.requests.map((request) => ({
      ...request,
      partner: { ...request.partner },
    })),
    items: item.items.map((lineItem) => ({
      ...lineItem,
      allocation: lineItem.allocation
        ? {
            id: lineItem.allocation.id,
            partner: clonePartner(lineItem.allocation.partner),
          }
        : null,
    })),
  }));
}

export function recomputeItemsAllocated(
  items: AllocationTableItem[]
): AllocationTableItem[] {
  return items.map((item) => ({
    ...item,
    requests: item.requests.map((request) => ({
      ...request,
      itemsAllocated: item.items
        .filter((line) => line.allocation?.partner?.id === request.partnerId)
        .reduce((sum, line) => sum + line.quantity, 0),
    })),
  }));
}

export function buildPreviewAllocations(
  baseItems: AllocationTableItem[],
  allocations: { lineItemId: number; partnerId: number | null }[]
): {
  previewItems: AllocationTableItem[];
  suggestions: AllocationSuggestion[];
} {
  const previewItems = cloneAllocationItems(baseItems);

  const lineItemIndexMap = new Map<
    number,
    { itemIndex: number; lineIndex: number }
  >();
  previewItems.forEach((item, itemIndex) => {
    item.items.forEach((line, lineIndex) => {
      lineItemIndexMap.set(line.id, { itemIndex, lineIndex });
    });
  });

  const originalLineMap = new Map<number, AllocationTableItem["items"][number]>();
  baseItems.forEach((item) => {
    item.items.forEach((line) => {
      originalLineMap.set(line.id, line);
    });
  });

  const partnerNameMap = new Map<number, string>();
  baseItems.forEach((item) => {
    item.requests.forEach((request) => {
      partnerNameMap.set(request.partnerId, request.partner.name);
    });
  });

  const suggestions: AllocationSuggestion[] = [];

  allocations.forEach(({ lineItemId, partnerId }) => {
    const location = lineItemIndexMap.get(lineItemId);
    if (!location) {
      return;
    }

    const originalLine = originalLineMap.get(lineItemId);
    const originalPartnerId = originalLine?.allocation?.partner?.id ?? null;
    if (originalPartnerId === partnerId) {
      return;
    }

    const previewItem = previewItems[location.itemIndex];
    const previewLine = previewItem.items[location.lineIndex];

    if (partnerId === null) {
      previewLine.allocation = null;

      suggestions.push({
        lineItemId,
        partnerId: null,
        partnerName: null,
      });
      return;
    }

    const partnerName =
      partnerNameMap.get(partnerId) ?? `Partner ${partnerId}`;

    previewLine.allocation = {
      id: -lineItemId,
      partner: {
        id: partnerId,
        name: partnerName,
      },
    };

    suggestions.push({
      lineItemId,
      partnerId,
      partnerName,
    });
  });

  const recomputed = recomputeItemsAllocated(previewItems);

  return {
    previewItems: recomputed,
    suggestions,
  };
}
