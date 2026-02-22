"use client";

import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "../baseTable/AdvancedBaseTable";
import { useCallback, useRef, useEffect } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { PartnerAllocation } from "@/types/api/allocation.types";
import { format } from "date-fns";
import Chip from "../chips/Chip";
import ShippingStatusTag from "../tags/ShippingStatusTag";
import SignatureImageTooltip from "../SignatureImageTooltip";
import { $Enums } from "@prisma/client";
import { useNotifications } from "@/components/NotificationHandler";

interface PartnerDistributionTableProps {
  pending: boolean; // true = in progress, false = completed
}

export default function PartnerDistributionTable({
  pending,
}: PartnerDistributionTableProps) {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<PartnerAllocation>>(null);
  const { refreshTick } = useNotifications();

  useEffect(() => {
    tableRef.current?.reload?.();
  }, [refreshTick]);

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<PartnerAllocation>
    ) => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        completed: (!pending).toString(), // pending=false means completed
        filters: JSON.stringify(filters),
      });
      const res = await apiClient.get<{
        data: PartnerAllocation[];
        total: number;
      }>(`/api/allocations?${searchParams.toString()}`);

      return {
        data: res.data,
        total: res.total,
      };
    },
    [apiClient, pending]
  );

  // In Progress columns
  const inProgressColumns = [
    {
      id: "item" as const,
      header: "Item",
      cell: (row: PartnerAllocation) => (
        <div>
          <div className="font-medium">{row.generalItemTitle}</div>
          <div className="text-sm text-gray-500">
            Lot: {row.lotNumber} | Pallet: {row.palletNumber} | Box:{" "}
            {row.boxNumber}
          </div>
        </div>
      ),
    },
    {
      id: "quantity" as const,
      header: "Quantity",
      cell: (row: PartnerAllocation) => row.quantity,
    },
    {
      id: "donorName" as const,
      header: "Donor",
      cell: (row: PartnerAllocation) => <Chip title={row.donorName} />,
    },
    {
      id: "shipmentStatus" as const,
      header: "Shipment Status",
      cell: (row: PartnerAllocation) => {
        const status = (row.shipmentStatus ||
          "WAITING_ARRIVAL_FROM_DONOR") as $Enums.ShipmentStatus;
        return <ShippingStatusTag status={status} />;
      },
    },
  ];

  // Completed columns
  const completedColumns = [
    {
      id: "item" as const,
      header: "Item",
      cell: (row: PartnerAllocation) => (
        <div>
          <div className="font-medium">{row.generalItemTitle}</div>
          <div className="text-sm text-gray-500">
            Lot: {row.lotNumber} | Pallet: {row.palletNumber} | Box:{" "}
            {row.boxNumber}
          </div>
        </div>
      ),
    },
    {
      id: "quantity" as const,
      header: "Quantity",
      cell: (row: PartnerAllocation) => row.quantity,
    },
    {
      id: "donorName" as const,
      header: "Donor",
      cell: (row: PartnerAllocation) => <Chip title={row.donorName} />,
    },
    {
      id: "signOffDate" as const,
      header: "Sign Off Date",
      cell: (row: PartnerAllocation) =>
        row.signOffDate
          ? format(new Date(row.signOffDate), "MMM d, yyyy")
          : "-",
    },
    {
      id: "signOffStaffMemberName" as const,
      header: "Signed Off By",
      cell: (row: PartnerAllocation) =>
        row.signOffStaffMemberName ? (
          <>
            <span
              data-tooltip-id={
                row.signOffSignatureUrl && row.signOffId
                  ? `signature-tooltip-${row.signOffId}`
                  : undefined
              }
              className={`${
                row.signOffSignatureUrl
                  ? "border-b-2 border-dotted border-gray-400 hover:border-gray-600 transition-colors cursor-pointer"
                  : ""
              }`}
            >
              {row.signOffStaffMemberName}
            </span>
            {row.signOffSignatureUrl && row.signOffId && (
              <SignatureImageTooltip
                signOffId={row.signOffId}
                signatureUrl={row.signOffSignatureUrl}
              />
            )}
          </>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={pending ? inProgressColumns : completedColumns}
      fetchFn={fetchTableData}
      rowId={"id"}
      disableFilters={false}
    />
  );
}
