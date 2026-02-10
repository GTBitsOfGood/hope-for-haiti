"use client";
import { format } from "date-fns";
import { useState, useRef, useCallback } from "react";
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
              <div className="text-sm text-gray-500 font-light">
                <span>{signOff.staffMemberName || "Unknown"}</span>
                <span className="mx-2">•</span>
                <span>
                  {signOff.date
                    ? format(new Date(signOff.date), "M/d/yyyy 'at' h:mm a")
                    : "N/A"}
                </span>
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

  const columns: ColumnDefinition<Shipment>[] = [
    {
      id: "donorShippingNumber",
      header: "Donor Shipping #",
      cell: (s) => s.donorShippingNumber,
    },
    {
      id: "hfhShippingNumber",
      header: "HFH Shipping #",
      cell: (s) => s.hfhShippingNumber,
    },
    {
      id: "status",
      header: "Status",
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
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchTableData}
      rowId="id"
      rowBody={(shipment) => (
        <div className="border-t bg-gray-50 px-6">
          <SignedOffItemsBody shipment={shipment} />
        </div>
      )}
    />
  );
}
