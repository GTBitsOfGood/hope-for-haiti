import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "./baseTable/AdvancedBaseTable";
import { useCallback, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import Portal from "./baseTable/Portal";
import toast from "react-hot-toast";
import { CheckCircle, DotsThree } from "@phosphor-icons/react";
import DistributionsGeneralItemChipGroup from "./chips/DistributionsGeneralItemGroup";
import { TableDistribution } from "@/types/api/distribution.types";

export default function DistributionTable() {
  const { apiClient } = useApiClient();
  const [distributions, setDistributions] = useState<TableDistribution[]>([]);

  const tableRef = useRef<AdvancedBaseTableHandle<TableDistribution>>(null);

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<TableDistribution>
    ) => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });
      const res = await apiClient.get<{
        data: TableDistribution[];
        total: number;
      }>(`/api/distributions?${searchParams.toString()}`);

      setDistributions(res.data);
      return {
        data: res.data,
        total: res.total,
      };
    },
    [apiClient]
  );

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={[
        {
          id: "partnerName",
          header: "Partner Name",
          cell: (row) => row.partner.name,
        },
        {
          id: "pending",
          header: "Status",
          cell: (row) => (
            <span
              className={`px-3 py-1 rounded ${row.pending ? "bg-yellow-primary/60 text-orange-primary" : "bg-green-primary/60 text-green-dark"}`}
            >
              {row.pending ? "Pending" : "Approved"}
            </span>
          ),
        },
        {
          id: "donors",
          header: "Donors",
          cell: (row) => (
            <div className="flex">
              {Array.from(
                new Set(
                  row.generalItems.map(
                    (generalItem) => generalItem.donorOffer.donorName
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
        {
          id: "Manage",
          header: "",
          cell: (distribution) => (
            <OptionsButton
              distribution={distribution}
              fetchTableData={tableRef.current!.reload}
            />
          ),
        },
      ]}
      fetchFn={fetchTableData}
      rowId={"id"}
      rowBody={(distribution) => (
        <DistributionsGeneralItemChipGroup
          generalItems={distribution.generalItems}
          otherDistributions={distributions.filter(
            (d) => d.id !== distribution.id && d.pending
          )}
          allocations={distribution.allocations}
          fetchTableData={tableRef.current!.reload}
        />
      )}
    />
  );
}

function OptionsButton({
  distribution,
  fetchTableData,
}: {
  distribution: TableDistribution;
  fetchTableData: () => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { apiClient } = useApiClient();

  async function approveDistribution() {
    const formData = new FormData();
    formData.append("pending", "false");

    const promise = apiClient.patch(`/api/distributions/${distribution.id}`, {
      body: formData,
    });

    toast.promise(promise, {
      loading: "Approving distribution...",
      success: "Distribution approved!",
      error: "Failed to approve distribution.",
    });

    await promise;

    setIsDropdownOpen(false);
    fetchTableData();
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="px-2 py-1 rounded hover:bg-gray-100"
      >
        <DotsThree size={16} />
      </button>
      <Portal
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-right"
        className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1"
      >
        <button
          onClick={approveDistribution}
          className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors duration-150 hover:bg-gray-50 text-gray-900 cursor-pointer"
        >
          <CheckCircle size={16} className="mr-3 flex-shrink-0" />
          <p>Approve</p>
        </button>
      </Portal>
    </div>
  );
}
