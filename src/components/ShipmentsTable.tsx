import { useApiClient } from "@/hooks/useApiClient";
import { useRef, useCallback } from "react";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "./baseTable/AdvancedBaseTable";
import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./Chip";
import { $Enums } from "@prisma/client";

export default function ShipmentsTable() {
  const { apiClient } = useApiClient();

  const tableRef = useRef<AdvancedBaseTableHandle<Shipment>>(null);

  const fetchTableData = useCallback(
    async (pageSize: number, page: number, filters: FilterList<Shipment>) => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });
      const res = await apiClient.get<Shipment[]>(
        `/api/shipments?${searchParams.toString()}`
      );

      return {
        data: res,
        total: res.length,
      };
    },
    [apiClient]
  );

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={[
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
          cell: (shipment) => <StatusBubble status={shipment.value} />,
        },
        {
          id: "partners",
          header: "Partners",
          cell: (shipment) =>
            shipment.generalItems
              .map((item) => item.partner)
              .map((partner) => <Chip key={partner.id} title={partner.name} />),
        },
      ]}
      fetchFn={fetchTableData}
      rowId={"id"}
    />
  );
}

function StatusBubble({ status }: { status: $Enums.ShipmentStatus }) {
  let text: string;
  let className: string = "bg-blue-primary/20 text-blue-primary";

  switch (status) {
    case $Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR:
      text = "Waiting Arrival from Donor";
      className = "bg-yellow-primary text-orange-primary";
      break;
    case $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION:
      text = "Inventories";
      className = "bg-green-primary text-green-dark";
      break;
    case $Enums.ShipmentStatus.LOAD_ON_SHIP_AIR:
      text = "Load on Ship/Air";
      break;
    case $Enums.ShipmentStatus.ARRIVED_AT_DEPO:
      text = "Arrived at Depot";
      break;
    case $Enums.ShipmentStatus.ARRIVED_IN_HAITI:
      text = "Arrived in Haiti";
      break;
    case $Enums.ShipmentStatus.CLEARED_CUSTOMS:
      text = "Cleared Customs";
      break;
    case $Enums.ShipmentStatus.INVENTORIES:
      text = "Inventories";
      break;
    case $Enums.ShipmentStatus.LOAD_ON_SHIP_AIR:
      text = "Load on Ship/Air";
      break;
    default:
      text = status;
      className = "bg-gray-primary/20 text-gray-primary";
  }

  return (
    <span className={`rounded px-3 py-1 text-sm font-semibold ${className}`}>
      {text}
    </span>
  );
}
