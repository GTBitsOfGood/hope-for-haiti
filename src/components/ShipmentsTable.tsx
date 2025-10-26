import { useApiClient } from "@/hooks/useApiClient";
import { useRef, useCallback, useState } from "react";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "./baseTable/AdvancedBaseTable";
import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./Chip";
import { $Enums } from "@prisma/client";
import { DotsThreeVertical, Clock, ArrowLeft } from "@phosphor-icons/react";
import Portal from "./baseTable/Portal";
import ConfiguredSelect from "./ConfiguredSelect";
import toast from "react-hot-toast";

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
        {
          id: "manage",
          header: "Manage",
          cell: (shipment) => (
            <OptionsButton
              shipment={shipment}
              fetchTableData={() => tableRef.current?.reload()}
            />
          ),
        },
      ]}
      fetchFn={fetchTableData}
      rowId={"id"}
      rowBody={(shipment) => (
        <GeneralItemChipGroup generalItems={shipment.generalItems} />
      )}
    />
  );
}

const shippingStatusToText = {
  [$Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR]:
    "Awaiting Arrival from Donor",
  [$Enums.ShipmentStatus.READY_FOR_DISTRIBUTION]: "Ready for Distribution",
  [$Enums.ShipmentStatus.ARRIVED_AT_DEPO]: "Arrived at Depot",
  [$Enums.ShipmentStatus.ARRIVED_IN_HAITI]: "Arrived in Haiti",
  [$Enums.ShipmentStatus.CLEARED_CUSTOMS]: "Cleared Customs",
  [$Enums.ShipmentStatus.INVENTORIES]: "Inventories",
  [$Enums.ShipmentStatus.LOAD_ON_SHIP_AIR]: "Load on Ship/Air",
};

function StatusBubble({ status }: { status: $Enums.ShipmentStatus }) {
  const text = shippingStatusToText[status];
  let className = "bg-blue-primary/20 text-blue-primary";

  switch (status) {
    case $Enums.ShipmentStatus.WAITING_ARRIVAL_FROM_DONOR:
      className = "bg-yellow-primary text-orange-primary";
      break;
    case $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION:
      className = "bg-green-primary text-green-dark";
      break;
  }

  return (
    <span className={`rounded px-3 py-1 text-sm font-semibold ${className}`}>
      {text}
    </span>
  );
}

function OptionsButton({
  shipment,
  fetchTableData,
}: {
  shipment: Shipment;
  fetchTableData: () => void;
}) {
  const [isBaseDropdownOpen, setIsBaseDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsBaseDropdownOpen(!isBaseDropdownOpen)}
        className="px-2 py-1 rounded hover:bg-gray-100"
      >
        <DotsThreeVertical size={16} />
      </button>
      <Portal
        isOpen={isBaseDropdownOpen}
        onClose={() => setIsBaseDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-left"
        className="bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm font-bold"
      >
        <button
          onClick={() => {
            setIsStatusDropdownOpen(true);
            setIsBaseDropdownOpen(false);
          }}
          className="px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1"
        >
          <Clock size={16} />
          <p>Change Status</p>
        </button>
      </Portal>
      <Portal
        isOpen={isStatusDropdownOpen}
        onClose={() => setIsStatusDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-left"
        className="bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm"
      >
        <ChangeStatusMenu
          shipment={shipment}
          fetchTableData={fetchTableData}
          back={() => {
            setIsBaseDropdownOpen(true);
            setIsStatusDropdownOpen(false);
          }}
        />
      </Portal>
    </div>
  );
}

function ChangeStatusMenu({
  shipment,
  fetchTableData,
  back,
}: {
  shipment: Shipment;
  fetchTableData: () => void;
  back: () => void;
}) {
  const { apiClient } = useApiClient();

  async function onChangeStatus(newStatus: $Enums.ShipmentStatus | undefined) {
    if (!newStatus || newStatus === shipment.value) return;

    const url = new URLSearchParams({
      donorShippingNumber: shipment.donorShippingNumber,
      hfhShippingNumber: shipment.hfhShippingNumber,
    });

    const promise = apiClient.patch(`/api/shipments?${url}`, {
      body: JSON.stringify({ status: newStatus }),
    });

    toast.promise(promise, {
      loading: "Updating status...",
      success: "Status updated",
      error: "Error updating status",
    });

    await promise;
    fetchTableData();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button onClick={back} className="p-1 rounded hover:bg-gray-100">
          <ArrowLeft size={16} />
        </button>
        <p className="font-bold">Change Status</p>
      </div>
      <ConfiguredSelect
        value={{
          value: shipment.value,
          label: shippingStatusToText[shipment.value],
        }}
        onChange={(newVal) => onChangeStatus(newVal?.value)}
        options={Object.values($Enums.ShipmentStatus).map((status) => ({
          value: status,
          label: shippingStatusToText[status],
        }))}
        placeholder="Select status"
      />
    </>
  );
}

function GeneralItemChipGroup({
  generalItems,
}: {
  generalItems: Shipment["generalItems"];
}) {
  return (
    <div className="w-full bg-sunken flex flex-wrap p-2">
      {generalItems.length === 0 && (
        <p className="w-full text-center text-gray-primary">
          No line items available.
        </p>
      )}
      {generalItems.map((item) => (
        <Chip
          key={item.id}
          title={item.title}
          label={item.partner.name}
          revisedAmount={item.lineItems.reduce(
            (total, li) => li.quantity + total,
            0
          )}
        />
      ))}
    </div>
  );
}
