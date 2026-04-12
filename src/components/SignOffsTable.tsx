"use client";
import { format } from "date-fns";
import { useState, useRef, useCallback, useEffect } from "react";
import { Package } from "@phosphor-icons/react";
import { useApiClient } from "@/hooks/useApiClient";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "./baseTable/AdvancedBaseTable";
import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./chips/Chip";
import ShippingStatusTag from "./tags/ShippingStatusTag";
import DetailedChip from "./chips/DetailedChip";
import { shippingStatusToText } from "@/util/util";
import SignatureImageTooltip from "./SignatureImageTooltip";

const SIGNOFFS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX = 5;
const SIGNOFFS_TUTORIAL_SAMPLE_ID = -996001;
const SIGNOFFS_TUTORIAL_SIGNATURE_URL = "/tutorial-signature.svg";

const SIGNOFFS_TUTORIAL_SAMPLE_SHIPMENT: Shipment = {
  id: SIGNOFFS_TUTORIAL_SAMPLE_ID,
  donorShippingNumber: "DON-39041",
  hfhShippingNumber: "HFH-81220",
  value: "READY_FOR_DISTRIBUTION",
  lineItems: [],
  signOffs: [
    {
      id: -996101,
      staffMemberName: "Alicia Joseph",
      partnerName: "Clinique Esperance",
      partnerSignerName: "Dr. Mireille Paul",
      date: new Date("2026-03-24T09:15:00.000Z"),
      signatureUrl: SIGNOFFS_TUTORIAL_SIGNATURE_URL,
      partnerSignatureUrl: SIGNOFFS_TUTORIAL_SIGNATURE_URL,
      lineItems: [
        {
          id: -996201,
          quantity: 60,
          palletNumber: "PAL-3A",
          boxNumber: "BX-04",
          lotNumber: "LOT-9011",
          generalItem: {
            id: -996301,
            title: "Amoxicillin 500mg",
          },
          allocation: {
            partner: {
              id: -996401,
              name: "Clinique Esperance",
            },
          },
        },
      ],
    },
  ],
};

function SignedOffItemsBody({
  shipment,
  tutorialHighlightSignature = false,
}: {
  shipment: Shipment;
  tutorialHighlightSignature?: boolean;
}) {
  const [showSignOffs] = useState(true);

  if (!shipment.signOffs?.length) {
    return <div className="text-sm text-gray-500">No sign-offs found.</div>;
  }

  return (
    <div className="w-full bg-sunken p-2">
      {showSignOffs && (
        <div className="border-gray-200 pt-4">
          {shipment.signOffs.map((signOff) => (
            <div key={signOff.id} className="space-y-2">
              {(() => {
                const staffTooltipId = `staff-signature-tooltip-${signOff.id}`;
                const partnerTooltipId = `partner-signature-tooltip-${signOff.id}`;
                const partnerDisplayName =
                  signOff.partnerSignerName || signOff.partnerName;

                return (
                  <>
                    <div className="text-sm text-gray-500 font-light">
                      <span>{signOff.staffMemberName || "Unknown"}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {signOff.date
                          ? format(new Date(signOff.date), "M/d/yyyy 'at' h:mm a")
                          : "N/A"}
                      </span>
                      {signOff.signatureUrl && (
                        <>
                          <span className="mx-2">•</span>
                          <span
                            data-tooltip-id={staffTooltipId}
                            data-tutorial={
                              tutorialHighlightSignature
                                ? "distributions-view-signature"
                                : undefined
                            }
                            className="underline decoration-dotted cursor-pointer text-gray-500"
                          >
                            View staff signature
                          </span>
                          <SignatureImageTooltip
                            tooltipId={staffTooltipId}
                            signatureUrl={signOff.signatureUrl}
                          />
                        </>
                      )}
                    </div>
                    {(partnerDisplayName || signOff.partnerSignatureUrl) && (
                      <div className="text-sm text-gray-500 font-light">
                        <span>{partnerDisplayName || "Partner signer"}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {signOff.date
                            ? format(new Date(signOff.date), "M/d/yyyy 'at' h:mm a")
                            : "N/A"}
                        </span>
                        {signOff.partnerSignatureUrl && (
                          <>
                            <span className="mx-2">•</span>
                            <span
                              data-tooltip-id={partnerTooltipId}
                              className="underline decoration-dotted cursor-pointer text-gray-500"
                            >
                              View partner signature
                            </span>
                            <SignatureImageTooltip
                              tooltipId={partnerTooltipId}
                              signatureUrl={signOff.partnerSignatureUrl}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

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
                    disabled={false}
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

type SignOffsTableProps = {
  tutorialMode?: boolean;
  tutorialStep?: number | null;
};

export default function SignOffsTable({
  tutorialMode = false,
  tutorialStep = null,
}: SignOffsTableProps) {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<Shipment>>(null);
  const shouldHighlightSignature =
    tutorialMode && tutorialStep === SIGNOFFS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX;

  const fetchTableData = useCallback(
    async (pageSize: number, page: number, filters: FilterList<Shipment>) => {
      if (tutorialMode) {
        return {
          data: [SIGNOFFS_TUTORIAL_SAMPLE_SHIPMENT],
          total: 1,
        };
      }

      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
        isCompleted: "true",
      });

      const res = await apiClient.get<{ data: Shipment[]; total: number }>(
        `/api/shipments?${searchParams.toString()}`
      );

      return { data: res.data, total: res.total };
    },
    [apiClient, tutorialMode]
  );

  useEffect(() => {
    if (!tutorialMode) {
      return;
    }

    tableRef.current?.reload();
  }, [tutorialMode, tutorialStep]);

  useEffect(() => {
    if (!tutorialMode) {
      return;
    }

    if (tutorialStep === SIGNOFFS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX) {
      tableRef.current?.setOpenRowIds(new Set([SIGNOFFS_TUTORIAL_SAMPLE_ID]));
      return;
    }

    tableRef.current?.setOpenRowIds(new Set());
  }, [tutorialMode, tutorialStep]);

  const columns: ColumnDefinition<Shipment>[] = [
    {
      id: "donorShippingNumber",
      header: "Donor Shipping #",
      filterType: "string",
      cell: (s) => s.donorShippingNumber,
    },
    {
      id: "hfhShippingNumber",
      header: "HFH Shipping #",
      cell: (s) => s.hfhShippingNumber,
    },
    {
      id: "value",
      header: "Status",
      filterType: "enum",
      filterOptions: Object.values(shippingStatusToText),
      cell: (s) => <ShippingStatusTag status={s.value} />,
    },
    {
      id: "partners",
      header: "Partners",
      cell: (shipment) => {
        const partnerMap = new Map<number, string>();
        shipment.signOffs.forEach((signOff) => {
          signOff.lineItems.forEach((item) => {
            partnerMap.set(item.allocation.partner.id, item.allocation.partner.name);
          });
        });
        return Array.from(partnerMap.entries()).map(([id, name]) => (
          <Chip key={id} title={name} />
        ));
      },
    },
  ];

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchTableData}
      rowId="id"
      getRowAttributes={(shipment) =>
        tutorialMode && shipment.id === SIGNOFFS_TUTORIAL_SAMPLE_ID
          ? { "data-tutorial": "distributions-signedoff-shipment-row" }
          : undefined
      }
      rowBody={(shipment) => (
        <div className="border-t bg-gray-50 px-6">
          <SignedOffItemsBody
            shipment={shipment}
            tutorialHighlightSignature={shouldHighlightSignature}
          />
        </div>
      )}
    />
  );
}
