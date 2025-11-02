import { useApiClient } from "@/hooks/useApiClient";
import { useRef, useCallback, useState } from "react";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
} from "./baseTable/AdvancedBaseTable";
import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./chips/Chip";
import { DotsThree, Clock } from "@phosphor-icons/react";
import Portal from "./baseTable/Portal";
import ChangeShippingStatusMenu from "./ChangeShippingStatusMenu";
import ShippingStatusTag from "./tags/ShippingStatusTag";
import GeneralItemChipGroup from "./chips/ShipmentsGeneralItemChipGroup";

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
      const res = await apiClient.get<{ data: Shipment[]; total: number }>(
        `/api/shipments?${searchParams.toString()}`
      );

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
          cell: (shipment) => <ShippingStatusTag status={shipment.value} />,
        },
        {
          id: "partners",
          header: "Partners",
          cell: (shipment) =>
            shipment.generalItems.map((item) => (
              <Chip
                key={`${item.id}-${item.partner.id}`}
                title={item.partner.name}
              />
            )),
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
        onClick={(e) => {
          e.stopPropagation();
          setIsBaseDropdownOpen(!isBaseDropdownOpen);
        }}
        className="px-2 py-1 rounded hover:bg-gray-100"
      >
        <DotsThree size={16} />
      </button>
      <Portal
        isOpen={isBaseDropdownOpen}
        onClose={() => setIsBaseDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-right"
        className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1"
      >
        <button
          onClick={() => {
            setIsStatusDropdownOpen(true);
            setIsBaseDropdownOpen(false);
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors duration-150 hover:bg-gray-50 text-gray-900 cursor-pointer"
        >
          <Clock size={16} className="mr-3 flex-shrink-0" />
          <p>Change Status</p>
        </button>
      </Portal>
      <Portal
        isOpen={isStatusDropdownOpen}
        onClose={() => setIsStatusDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-right"
        className="bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm"
      >
        <ChangeShippingStatusMenu
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
