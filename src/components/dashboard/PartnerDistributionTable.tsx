"use client";

import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "../baseTable/AdvancedBaseTable";
import { forwardRef, useCallback, useEffect, useState, useImperativeHandle, useRef } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import { PartnerAllocation } from "@/types/api/allocation.types";
import { format } from "date-fns";
import Chip from "../chips/Chip";
import ShippingStatusTag from "../tags/ShippingStatusTag";
import SignatureImageTooltip from "../SignatureImageTooltip";
import { $Enums } from "@prisma/client";

type DataAttributes = Partial<
  Record<`data-${string}`, string | number | boolean>
>;

interface PartnerDistributionTableProps {
  pending: boolean; // true = in progress, false = completed
  rowClassName?: (
    item: PartnerAllocation,
    index: number
  ) => string | undefined;
  getRowAttributes?: (
    item: PartnerAllocation,
    index: number
  ) => DataAttributes | undefined;
}

export interface PartnerDistributionTableHandle {
  reload: () => void;
  setItems: (
    value:
      | PartnerAllocation[]
      | ((items: PartnerAllocation[]) => PartnerAllocation[])
  ) => void;
  removeItemById: (id: string | number) => void;
  getAllItems: () => PartnerAllocation[];
}

const PartnerDistributionTable = forwardRef<
  PartnerDistributionTableHandle,
  PartnerDistributionTableProps
>(function PartnerDistributionTable(
  { pending, rowClassName, getRowAttributes },
  ref
) {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<PartnerAllocation>>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onShipmentUpdate = () => {
      setRefreshKey((k) => k + 1);
    };

    window.addEventListener("shipment-status-updated", onShipmentUpdate);
    return () =>
      window.removeEventListener("shipment-status-updated", onShipmentUpdate);
  }, []);

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

  useImperativeHandle(
    ref,
    () => ({
      reload: () => tableRef.current?.reload(),
      setItems: (value) => tableRef.current?.setItems(value),
      removeItemById: (id) => tableRef.current?.removeItemById(id),
      getAllItems: () => tableRef.current?.getAllItems() ?? [],
    }),
    []
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
                tooltipId={`signature-tooltip-${row.signOffId}`}
                signatureUrl={row.signOffSignatureUrl}
              />
            )}
          </>
        ) : (
          "-"
        ),
    },
    {
      id: "partnerSignerName" as const,
      header: "Received By",
      cell: (row: PartnerAllocation) =>
        row.partnerSignerName ? (
          <>
            <span
              data-tooltip-id={
                row.partnerSignatureUrl
                  ? `signature-tooltip-partner-${row.id}`
                  : undefined
              }
              className={`${
                row.partnerSignatureUrl
                  ? "border-b-2 border-dotted border-gray-400 hover:border-gray-600 transition-colors cursor-pointer"
                  : ""
              }`}
            >
              {row.partnerSignerName}
            </span>
            {row.partnerSignatureUrl && (
              <SignatureImageTooltip
                tooltipId={`signature-tooltip-partner-${row.id}`}
                signatureUrl={row.partnerSignatureUrl}
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
      key={refreshKey}
      ref={tableRef}
      columns={pending ? inProgressColumns : completedColumns}
      fetchFn={fetchTableData}
      rowId={"id"}
      disableFilters={false}
      rowClassName={rowClassName}
      getRowAttributes={getRowAttributes}
    />
  );
});

export default PartnerDistributionTable;
