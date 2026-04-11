"use client";
import { format } from "date-fns";
import { useState, useRef, useCallback } from "react";
import { Package, FileCsv } from "@phosphor-icons/react";
import { useApiClient } from "@/hooks/useApiClient";
import toast from "react-hot-toast";
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
import ReportGenerationModal, {
  ReportFilters,
} from "./ReportGenerationModal";

function SignedOffItemsBody({ shipment }: { shipment: Shipment }) {
  const [showSignOffs] = useState(true);

  if (!shipment.signOffs?.length) {
    return <div className="text-sm text-gray-500">No sign-offs found.</div>;
  }

  return (
    <div className="w-full bg-sunken p-2">
      {showSignOffs && (
        <div className=" border-gray-200 pt-4">
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

export default function SignOffsTable() {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<Shipment>>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTableData = useCallback(
    async (pageSize: number, page: number, filters: FilterList<Shipment>) => {
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
    [apiClient]
  );

  const handleReportSubmit = async (
    reportType: string,
    filters: ReportFilters
  ) => {
    const loadingToastId = toast.loading("Generating report...");

    try {
      const queryParams = new URLSearchParams({
        reportType: filters.reportType,
      });

      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.shipmentId)
        queryParams.append("shipmentId", filters.shipmentId);
      if (filters.donorName) queryParams.append("donorName", filters.donorName);

      const response = await fetch(
        `/api/reports/generate?${queryParams.toString()}`
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        let errorMessage = "Failed to generate report";

        if (contentType.includes("application/json")) {
          const body = (await response.json()) as {
            error?: string;
            message?: string;
          };
          errorMessage = body.error ?? body.message ?? errorMessage;
        } else {
          const body = (await response.text()).trim();
          if (body) {
            errorMessage = body;
          }
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("content-disposition");
      const fileName =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ??
        `report-${Date.now()}.csv`;

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);

      toast.dismiss(loadingToastId);
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate report"
      );
    }
  };

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
            partnerMap.set(
              item.allocation.partner.id,
              item.allocation.partner.name
            );
          });
        });
        return Array.from(partnerMap.entries()).map(([id, name]) => (
          <Chip key={id} title={name} />
        ));
      },
    },
  ];

  return (
    <>
      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchTableData}
        rowId="id"
        toolBar={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-blue-primary px-4 py-2 font-semibold text-white hover:bg-blue-primary/80 transition-colors"
          >
            <FileCsv size={20} />
            Generate Reports
          </button>
        }
        rowBody={(shipment) => (
          <div className="border-t bg-gray-50 px-6">
            <SignedOffItemsBody shipment={shipment} />
          </div>
        )}
      />

      <ReportGenerationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </>
  );
}
