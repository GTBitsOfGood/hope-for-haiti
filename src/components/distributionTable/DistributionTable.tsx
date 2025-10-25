import AdvancedBaseTable, { FilterList } from "../baseTable/AdvancedBaseTable";
import { useCallback, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import Portal from "../baseTable/Portal";
import toast from "react-hot-toast";

type Distribution = {
  id: number;
  pending: boolean;
  partner: {
    name: string;
  };
  generalItems: {
    donorOffer: {
      donorName: string;
    };
    lineItems: {
      id: number;
      quantity: number;
      hfhShippingNumber: string | null;
      donorShippingNumber: string | null;
    }[];
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
          id: "options",
          header: "",
          cell: (distribution) => <OptionsButton distribution={distribution} />,
        },
      ]}
      fetchFn={fetchTableData}
      rowId={"id"}
    />
  );
}

function OptionsButton({ distribution }: { distribution: Distribution }) {
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
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="border border-gray-primary px-2 py-1 rounded hover:bg-gray-100"
      >
        Options
      </button>
      <Portal
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-left"
        className="bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm font-bold"
      >
        <button
          onClick={approveDistribution}
          className="border border-gray-primary px-2 py-1 rounded hover:bg-gray-100"
        >
          Approve
        </button>
      </Portal>
    </div>
  );
}

// function GeneralItemChipList({
//   generalItems,
// }: {
//   generalItems: Distribution["allocations"][number]["lineItem"]["generalItem"][];
// }) {}
