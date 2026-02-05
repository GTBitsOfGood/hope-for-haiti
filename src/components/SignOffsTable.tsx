"use client";
import { useApiClient } from "@/hooks/useApiClient";
import { useRef, useCallback } from "react";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "./baseTable/AdvancedBaseTable";
import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./chips/Chip";
import ShippingStatusTag from "./tags/ShippingStatusTag";

function SignedOffItemsBody({ shipment }: { shipment: Shipment }) {
  if (!shipment.signOffs?.length) {
    return <div className="text-sm text-gray-500">No sign-offs found.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {shipment.signOffs.map((signOff) => (
        <div key={signOff.id} className="rounded border p-3">
          <div className="mb-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Staff:</span>{" "}
              {signOff.staffMemberName || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Partner:</span>{" "}
              {signOff.partnerName || "Unknown"}
            </div>
            <div>
              <span className="font-medium">Date:</span>{" "}
              {signOff.date ? new Date(signOff.date).toLocaleString() : "N/A"}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {signOff.lineItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <Chip title={item.allocation.partner.name} />
                <span className="font-medium">{item.generalItem.title}</span>
                <span className="text-gray-600">Qty: {item.quantity}</span>
                <span className="text-gray-600">
                  {item.palletNumber ? `Pallet: ${item.palletNumber}` : ""}
                </span>
                <span className="text-gray-600">
                  {item.boxNumber ? `Box: ${item.boxNumber}` : ""}
                </span>
                <span className="text-gray-600">
                  {item.lotNumber ? `Lot: ${item.lotNumber}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SignOffsTable() {
  const { apiClient } = useApiClient();
  const tableRef = useRef<AdvancedBaseTableHandle<Shipment>>(null);

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

      return {
        data: res.data,
        total: res.total,
      };
    },
    [apiClient]
  );

  const columns: ColumnDefinition<Shipment>[] = [
    {
      id: "donorShippingNumber",
      header: "Donor Shipping #",
      cell: (shipment) => shipment.donorShippingNumber,
    },
    {
      id: "hfhShippingNumber",
      header: "HFH Shipping #",
      cell: (shipment) => shipment.hfhShippingNumber,
    },
    {
      id: "status",
      header: "Status",
      cell: (shipment) => <ShippingStatusTag status={shipment.value} />,
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
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchTableData}
      rowId="id"
      rowBody={(shipment) => <SignedOffItemsBody shipment={shipment} />}
    />
  );
}
