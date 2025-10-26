import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "./baseTable/AdvancedBaseTable";
import { useCallback, useRef, useState } from "react";
import { useApiClient } from "@/hooks/useApiClient";
import Portal from "./baseTable/Portal";
import toast from "react-hot-toast";
import Chip from "./Chip";
import ConfiguredSelect from "@/components/ConfiguredSelect";
import { CheckCircle, DotsThreeVertical } from "@phosphor-icons/react";

type Allocation = {
  id: number;
  lineItemId: number;
};

type Distribution = {
  id: number;
  pending: boolean;
  partner: {
    id: number;
    name: string;
  };
  allocations: Allocation[];
  generalItems: {
    id: number;
    title: string;
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
  const [distributions, setDistributions] = useState<Distribution[]>([]);

  const tableRef = useRef<AdvancedBaseTableHandle<Distribution>>(null);

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
      const res = await apiClient.get<{ data: Distribution[]; total: number }>(
        `/api/distributions?${searchParams.toString()}`
      );

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
        <GeneralItemChipList
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
  distribution: Distribution;
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
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="px-2 py-1 rounded hover:bg-gray-100"
      >
        <DotsThreeVertical size={16} />
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
          className="px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1"
        >
          <CheckCircle size={16} />
          <p>Approve</p>
        </button>
      </Portal>
    </div>
  );
}

function GeneralItemChipList({
  generalItems,
  otherDistributions,
  allocations,
  fetchTableData,
}: {
  generalItems: Distribution["generalItems"];
  otherDistributions: Distribution[];
  allocations: Allocation[];
  fetchTableData: () => void;
}) {
  return (
    <div className="w-full bg-sunken flex flex-wrap p-2">
      {generalItems.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No general items.
        </p>
      )}
      {generalItems.map((item) => (
        <GeneralItemChip
          key={item.id}
          generalItem={item}
          otherDistributions={otherDistributions}
          allocations={allocations}
          fetchTableData={fetchTableData}
        />
      ))}
    </div>
  );
}

function GeneralItemChip({
  generalItem,
  otherDistributions,
  allocations,
  fetchTableData,
}: {
  generalItem: Distribution["generalItems"][number];
  otherDistributions: Distribution[];
  allocations: Allocation[];
  fetchTableData: () => void;
}) {
  const [selectedDistribution, setSelectedDistribution] = useState<number>();
  const [selectedLineItems, setSelectedLineItems] = useState<number[]>([]);

  const { apiClient } = useApiClient();

  function lineItemLabel(
    lineItem: Distribution["generalItems"][number]["lineItems"][number]
  ) {
    return `${generalItem.title} x${lineItem.quantity}`;
  }

  async function transferLineItems() {
    if (!selectedDistribution || selectedLineItems.length === 0) {
      return;
    }

    const allocationIds = allocations
      .filter((allocation) => selectedLineItems.includes(allocation.lineItemId))
      .map((allocation) => allocation.id);

    const distribution = otherDistributions.find(
      (d) => d.id === selectedDistribution
    );

    if (!distribution) {
      return;
    }

    const promise = apiClient.patch(
      `/api/distributions/${distribution.id}/allocations/batch`,
      {
        body: JSON.stringify({
          allocations: allocationIds.map((id) => ({ id })),
          distributionId: selectedDistribution,
          partnerId: distribution.partner.id,
        }),
      }
    );

    toast.promise(promise, {
      loading: "Transferring line items...",
      success: "Line items transferred!",
      error: "Failed to transfer line items.",
    });

    await promise;

    setSelectedDistribution(undefined);
    setSelectedLineItems([]);

    fetchTableData();
  }

  return (
    <Chip
      title={generalItem.title}
      popover={
        <div className="flex flex-col gap-2">
          <p className="text-gray-primary font-bold mb-1">
            Allocate to Partner
          </p>
          <p className="text-sm text-gray-primary font-normal">
            Select Distribution
          </p>
          <ConfiguredSelect
            value={
              selectedDistribution
                ? {
                    value: selectedDistribution,
                    label:
                      otherDistributions.find(
                        (d) => d.id === selectedDistribution
                      )?.partner.name || "",
                  }
                : undefined
            }
            onChange={(newVal) => setSelectedDistribution(newVal?.value)}
            options={otherDistributions.map((distribution) => ({
              value: distribution.id,
              label: distribution.partner.name,
            }))}
            isClearable
            placeholder="Choose distribution..."
          />
          <p className="text-sm text-gray-primary font-normal">
            Select Line Items
          </p>
          <ConfiguredSelect
            value={selectedLineItems.map((id) => ({
              value: id,
              label: lineItemLabel(
                generalItem.lineItems.find((li) => li.id === id)!
              ),
            }))}
            onChange={(newVal) =>
              setSelectedLineItems(newVal.map((item) => item.value))
            }
            options={generalItem.lineItems.map((lineItem) => ({
              value: lineItem.id,
              label: lineItemLabel(lineItem),
            }))}
            isClearable
            isMulti
            placeholder="Choose line items..."
          />
          <div className="w-full flex justify-end">
            <button
              onClick={transferLineItems}
              className="rounded bg-blue-primary text-white px-3 py-1"
            >
              Transfer
            </button>
          </div>
        </div>
      }
    />
  );
}
