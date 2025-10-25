import AdvancedBaseTable, { FilterList } from "../baseTable/AdvancedBaseTable";
import { useCallback } from "react";
import { useApiClient } from "@/hooks/useApiClient";

type Distribution = {
  id: number;
  pending: boolean;
  partner: {
    name: string;
  };
  allocations: {
    lineItem: {
      generalItem: {
        donorOffer: {
          donorName: string;
        };
      };
    };
  }[];
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
      columns={[
        {
          id: "partnerName",
          header: "Partner Name",
          cell: (row) => row.partner.name,
        },
        "pending",
        {
          id: "donors",
          header: "Donors",
          cell: (row) => (
            <div className="flex">
              {Array.from(
                new Set(
                  row.allocations.map(
                    (allocation) =>
                      allocation.lineItem.generalItem.donorOffer.donorName
                  )
                )
              ).map((name) => (
                <span
                  key={name}
                  className="rounded-lg border m-2 px-2 py-1 text-sm flex items-center gap-1 border-blue-primary text-blue-primary"
                >
                  {name}
                </span>
              ))}
            </div>
          ),
        },
      ]}
      fetchFn={fetchTableData}
      rowId={"id"}
    />
  );
}
