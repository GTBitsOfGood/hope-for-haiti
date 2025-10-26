import { useApiClient } from "@/hooks/useApiClient";
import { useRef, useCallback } from "react";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "./baseTable/AdvancedBaseTable";

type Shipment = {
  id: number;
  donorShippingNumber: string;
  hfhShippingNumber: string;
  /**
   * Status
   */
  value: string;
};

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
          cell: (shipment) => shipment.value,
        },
      ]}
      fetchFn={fetchTableData}
      rowId={"id"}
    />
  );
}
