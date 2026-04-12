import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "./baseTable/AdvancedBaseTable";
import { useCallback, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import Portal from "./baseTable/Portal";
import toast from "react-hot-toast";
import { CheckCircle, DotsThree, XCircle } from "@phosphor-icons/react";
import DistributionsGeneralItemChipGroup from "./chips/DistributionsGeneralItemChipGroup";
import { TableDistribution } from "@/types/api/distribution.types";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";

const DISTRIBUTIONS_TUTORIAL_SAMPLE_ID = -994001;
const DISTRIBUTIONS_TUTORIAL_EDIT_STEP_INDEX = 1;

const DISTRIBUTIONS_TUTORIAL_SAMPLE_DISTRIBUTION: TableDistribution = {
  id: DISTRIBUTIONS_TUTORIAL_SAMPLE_ID,
  pending: true,
  createdAt: new Date("2026-03-18T13:40:00.000Z"),
  updatedAt: new Date("2026-03-18T13:40:00.000Z"),
  partner: {
    id: -994101,
    name: "Hope Medical Center",
  },
  allocations: [
    {
      id: -994201,
      lineItemId: -994301,
    },
  ],
  generalItems: [
    {
      id: -994401,
      title: "Oral Rehydration Salts",
      donorOffer: {
        donorName: "CareBridge Relief",
      },
      lineItems: [
        {
          id: -994301,
          quantity: 240,
          hfhShippingNumber: "HFH-56102",
          donorShippingNumber: "DON-34812",
        },
      ],
    },
  ],
};

type DistributionTableProps = {
  tutorialMode?: boolean;
  tutorialStep?: number | null;
};

export default function DistributionTable({
  tutorialMode = false,
  tutorialStep = null,
}: DistributionTableProps) {
  const { apiClient } = useApiClient();
  const { user } = useUser();
  const canManageDistributions = hasPermission(user, "distributionWrite");

  const tableRef = useRef<AdvancedBaseTableHandle<TableDistribution>>(null);
  const tutorialShowApproveMenu =
    tutorialMode &&
    (tutorialStep === null ||
      tutorialStep <= DISTRIBUTIONS_TUTORIAL_EDIT_STEP_INDEX);

  const fetchTableData = useCallback(
    async (
      pageSize: number,
      page: number,
      filters: FilterList<TableDistribution>
    ) => {
      if (tutorialMode) {
        return {
          data: [DISTRIBUTIONS_TUTORIAL_SAMPLE_DISTRIBUTION],
          total: 1,
        };
      }

      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });
      const res = await apiClient.get<{
        data: TableDistribution[];
        total: number;
      }>(`/api/distributions?${searchParams.toString()}`);

      return {
        data: res.data,
        total: res.total,
      };
    },
    [apiClient, tutorialMode]
  );

  const columns = [
    {
      id: "partnerName",
      header: "Partner Name",
      filterType: "string",
      cell: (row) => row.partner.name,
    },
    {
      id: "pending",
      header: "Status",
      filterType: "enum",
      filterOptions: ["Pending", "Approved"],
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
              row.generalItems.map((generalItem) => generalItem.donorOffer.donorName)
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
      id: "createdAt",
      header: "Created",
      cell: (row) => {
        const date = new Date(row.createdAt);
        if (isNaN(date.getTime())) {
          return "N/A";
        }
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      },
    },
  ] as ColumnDefinition<TableDistribution>[];

  if (canManageDistributions || tutorialMode) {
    columns.push({
      id: "Manage",
      headerClassName: "text-right",
      header: "",
      cell: (distribution) => (
        <div className="flex justify-end">
          <OptionsButton
            distribution={distribution}
            fetchTableData={tableRef.current?.reload ?? (() => undefined)}
            tutorialMode={tutorialMode}
            tutorialShowApproveMenu={tutorialShowApproveMenu}
          />
        </div>
      ),
    });
  }

  return (
    <AdvancedBaseTable
      ref={tableRef}
      columns={columns}
      fetchFn={fetchTableData}
      rowId="id"
      rowBody={(distribution) => (
        <DistributionsGeneralItemChipGroup
          generalItems={distribution.generalItems}
          allocations={distribution.allocations}
          fetchTableData={tableRef.current?.reload ?? (() => undefined)}
          pending={distribution.pending}
          canTransfer={canManageDistributions}
          distributionId={distribution.id}
        />
      )}
      getRowAttributes={(distribution) =>
        tutorialMode && distribution.id === DISTRIBUTIONS_TUTORIAL_SAMPLE_ID
          ? { "data-tutorial": "distributions-sample-pending-row" }
          : undefined
      }
    />
  );
}

function OptionsButton({
  distribution,
  fetchTableData,
  tutorialMode = false,
  tutorialShowApproveMenu = false,
}: {
  distribution: TableDistribution;
  fetchTableData: () => void;
  tutorialMode?: boolean;
  tutorialShowApproveMenu?: boolean;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { apiClient } = useApiClient();
  const isTutorialSampleDistribution =
    tutorialMode && distribution.id === DISTRIBUTIONS_TUTORIAL_SAMPLE_ID;

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

    try {
      await promise;
      fetchTableData();
    } finally {
      setIsDropdownOpen(false);
    }
  }

  async function unapproveDistribution() {
    const formData = new FormData();
    formData.append("pending", "true");

    const promise = apiClient.patch(`/api/distributions/${distribution.id}`, {
      body: formData,
    });

    toast.promise(promise, {
      loading: "Unapproving distribution...",
      success: "Distribution unapproved!",
      error: "Failed to unapprove distribution.",
    });

    try {
      await promise;
      fetchTableData();
    } finally {
      setIsDropdownOpen(false);
    }
  }

  if (
    isTutorialSampleDistribution &&
    tutorialShowApproveMenu &&
    distribution.pending
  ) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100"
          aria-label="Open distribution options"
        >
          <DotsThree size={16} />
        </button>
        <Portal
          isOpen={true}
          onClose={() => undefined}
          triggerRef={buttonRef}
          position="bottom-right"
          closeOnOutsideClick={false}
          className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1"
        >
          <div data-tutorial="distributions-edit-approve-menu">
            <button
              type="button"
              data-tutorial="distributions-edit-approve-option"
              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-900 cursor-default"
            >
              <CheckCircle size={16} className="mr-3 flex-shrink-0" />
              <p>Approve</p>
            </button>
          </div>
        </Portal>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
        {distribution.pending ? (
          <button
            onClick={approveDistribution}
            className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors duration-150 hover:bg-gray-50 text-gray-900 cursor-pointer"
          >
            <CheckCircle size={16} className="mr-3 flex-shrink-0" />
            <p>Approve</p>
          </button>
        ) : (
          <button
            onClick={unapproveDistribution}
            className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors duration-150 hover:bg-gray-50 text-gray-900 cursor-pointer"
          >
            <XCircle size={16} className="mr-3 flex-shrink-0" />
            <p>Unapprove</p>
          </button>
        )}
      </Portal>
    </div>
  );
}
