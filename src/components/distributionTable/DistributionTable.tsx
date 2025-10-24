import AdvancedBaseTable, { FilterList } from "../baseTable/AdvancedBaseTable";
import { useCallback } from "react";
import { useApiClient } from "@/hooks/useApiClient";

type Distribution = {
  id: number;
  partnerName: string;
};

export default function DistributionTable() {
  const { apiClient } = useApiClient();

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<Distribution>
    ) => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });
      const res = await apiClient.get<Distribution[]>(
        `/api/distributions?${searchParams.toString()}`
      );

      console.log(res);
      return {
        data: res,
        total: res.length,
      };
    },
    [apiClient]
  );

  return (
    <AdvancedBaseTable
      columns={["partnerName"]}
      fetchFn={fetchTableData}
      rowId={"id"}
    />
  );
}
