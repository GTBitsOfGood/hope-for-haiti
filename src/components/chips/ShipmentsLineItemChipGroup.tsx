"use client";

import { useState } from "react";
import DetailedChip from "./DetailedChip";
import { Package, CaretDown } from "@phosphor-icons/react";
import { Shipment } from "@/types/api/shippingStatus.types";
import { format } from "date-fns";
import SignatureImageTooltip from "../SignatureImageTooltip";

interface ShipmentsLineItemChipGroupProps {
  shipment: Shipment;
  canCreateSignOffs: boolean;
  onSignOffClick: (
    selectedAllocationIds: number[],
    partnerId: number,
    partnerName: string
  ) => void;
}

export default function ShipmentsLineItemChipGroup({
  shipment,
  canCreateSignOffs,
  onSignOffClick,
}: ShipmentsLineItemChipGroupProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showSignOffs, setShowSignOffs] = useState(false);

  const unsignedLineItems = shipment.lineItems;
  const hasSelectedItems = selectedItems.size > 0;
  const isReadyForDistribution = shipment.value === "READY_FOR_DISTRIBUTION";

  const getSelectedPartnerInfo = () => {
    if (selectedItems.size === 0) return null;
    const firstSelected = unsignedLineItems.find((li) =>
      selectedItems.has(li.id)
    );
    if (!firstSelected) return null;
    return {
      partnerId: firstSelected.allocation.partner.id,
      partnerName: firstSelected.allocation.partner.name,
    };
  };

  const handleItemClick = (lineItemId: number) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(lineItemId)) {
      newSelectedItems.delete(lineItemId);
    } else {
      newSelectedItems.add(lineItemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleSignOffClick = () => {
    if (hasSelectedItems && isReadyForDistribution) {
      const partnerInfo = getSelectedPartnerInfo();
      if (!partnerInfo) return;

      const selectedAllocationIds = unsignedLineItems
        .filter((li) => selectedItems.has(li.id))
        .map((li) => li.allocation.id);

      onSignOffClick(
        selectedAllocationIds,
        partnerInfo.partnerId,
        partnerInfo.partnerName
      );
    }
  };

  return (
    <div className="w-full bg-sunken p-2">
      {unsignedLineItems.length === 0 && shipment.signOffs.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No line items available.
        </p>
      )}

      {unsignedLineItems.length > 0 && (
        <div className="flex flex-wrap">
          {unsignedLineItems.map((lineItem) => {
            const isPending = lineItem.allocation.distribution.pending;
            const canClick = canCreateSignOffs && !isPending;
            return (
              <DetailedChip
                key={lineItem.id}
                title={lineItem.generalItem.title}
                subtitle={`Pallet ${lineItem.palletNumber}`}
                label={lineItem.allocation.partner.name}
                amount={lineItem.quantity}
                icon={
                  <Package
                    size={16}
                    className="text-blue-primary flex-shrink-0"
                  />
                }
                selected={canCreateSignOffs && selectedItems.has(lineItem.id)}
                onClick={canClick ? () => handleItemClick(lineItem.id) : undefined}
                disabled={isPending}
                labelColor={isPending ? "yellow" : "red"}
              />
            );
          })}
        </div>
      )}

      <div className="relative flex items-center mt-2 w-full">
        {shipment.signOffs.length > 0 && (
          <button
            onClick={() => setShowSignOffs(!showSignOffs)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            <CaretDown
              size={16}
              className={`transition-transform ${showSignOffs ? "rotate-180" : ""}`}
            />
            <span>SignOffs</span>
          </button>
        )}

        {canCreateSignOffs && hasSelectedItems && (
          <button
            onClick={handleSignOffClick}
            disabled={!isReadyForDistribution}
            className={`ml-auto px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isReadyForDistribution
                ? "bg-blue-primary text-white hover:bg-blue-primary/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isReadyForDistribution ? "SignOff Items" : "Shipment not Ready"}
          </button>
        )}
      </div>

      {showSignOffs && shipment.signOffs.length > 0 && (
        <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
          {shipment.signOffs.map((signOff) => (
            <div key={signOff.id} className="space-y-2">
              <div className="text-sm text-gray-500 font-light">
                <span>{signOff.staffMemberName}</span>
                <span className="mx-2">•</span>
                <span>
                  {format(new Date(signOff.date), "MMM d, yyyy 'at' h:mm a")}
                </span>
                {signOff.signatureUrl && (
                  <>
                    <span className="mx-2">•</span>
                    <span
                      data-tooltip-id={`signature-tooltip-${signOff.id}`}
                      className="underline decoration-dotted cursor-pointer text-gray-500"
                    >
                      View signature
                    </span>
                    <SignatureImageTooltip
                      signOffId={signOff.id}
                      signatureUrl={signOff.signatureUrl}
                    />
                  </>
                )}
              </div>
              <div className="flex flex-wrap">
                {signOff.lineItems.map((lineItem) => (
                  <DetailedChip
                    key={lineItem.id}
                    title={lineItem.generalItem.title}
                    subtitle={`Pallet ${lineItem.palletNumber}`}
                    label={lineItem.allocation.partner.name}
                    amount={lineItem.quantity}
                    icon={
                      <Package
                        size={16}
                        className="text-gray-400 flex-shrink-0"
                      />
                    }
                    selected={false}
                    disabled={true}
                    labelColor="red"
                    className="opacity-70"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
