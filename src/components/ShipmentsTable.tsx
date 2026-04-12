import { useApiClient } from "@/hooks/useApiClient";
import { useRef, useCallback, useState, useEffect } from "react";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "./baseTable/AdvancedBaseTable";
import { Shipment } from "@/types/api/shippingStatus.types";
import Chip from "./chips/Chip";
import { DotsThree, Clock, Pencil } from "@phosphor-icons/react";
import Portal from "./baseTable/Portal";
import ChangeShippingStatusMenu from "./ChangeShippingStatusMenu";
import ShippingStatusTag from "./tags/ShippingStatusTag";
import ShipmentsLineItemChipGroup from "./chips/ShipmentsLineItemChipGroup";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";
import SignOffModal from "./SignOffModal";
import { shippingStatusToText } from "@/util/util";
import EditHfhShippingNumberModal from "./EditHfhShippingNumberModal";

const SHIPMENTS_TUTORIAL_TRACK_SHIPMENTS_STEP_INDEX = 2;
const SHIPMENTS_TUTORIAL_READY_FOR_DISTRIBUTION_STEP_INDEX = 3;
const SHIPMENTS_TUTORIAL_SIGN_OFF_ITEMS_STEP_INDEX = 4;
const SHIPMENTS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX = 5;
const SHIPMENTS_TUTORIAL_TRACKING_SAMPLE_ID = -995001;
const SHIPMENTS_TUTORIAL_READY_SAMPLE_ID = -995002;
const SHIPMENTS_TUTORIAL_READY_SELECTED_LINE_ITEM_IDS = [-995111, -995112];

const SHIPMENTS_TUTORIAL_TRACKING_SAMPLE: Shipment = {
  id: SHIPMENTS_TUTORIAL_TRACKING_SAMPLE_ID,
  donorShippingNumber: "DON-47291",
  hfhShippingNumber: "HFH-77019",
  value: "ARRIVED_IN_HAITI",
  signOffs: [],
  lineItems: [
    {
      id: -995101,
      quantity: 180,
      palletNumber: "PAL-7B",
      boxNumber: "BX-12",
      lotNumber: "LOT-8892",
      generalItem: {
        id: -995201,
        title: "Sterile Gauze Pads",
      },
      allocation: {
        id: -995301,
        partner: {
          id: -995401,
          name: "Hope Medical Center",
        },
        distribution: {
          id: -995501,
          pending: false,
        },
      },
    },
  ],
};

const SHIPMENTS_TUTORIAL_READY_SAMPLE: Shipment = {
  id: SHIPMENTS_TUTORIAL_READY_SAMPLE_ID,
  donorShippingNumber: "DON-48800",
  hfhShippingNumber: "HFH-78133",
  value: "READY_FOR_DISTRIBUTION",
  signOffs: [],
  lineItems: [
    {
      id: -995111,
      quantity: 60,
      palletNumber: "PAL-3A",
      boxNumber: "BX-04",
      lotNumber: "LOT-9011",
      generalItem: {
        id: -995211,
        title: "Amoxicillin 500mg",
      },
      allocation: {
        id: -995311,
        partner: {
          id: -995411,
          name: "Clinique Esperance",
        },
        distribution: {
          id: -995511,
          pending: false,
        },
      },
    },
    {
      id: -995112,
      quantity: 40,
      palletNumber: "PAL-3A",
      boxNumber: "BX-05",
      lotNumber: "LOT-9012",
      generalItem: {
        id: -995212,
        title: "Nitrile Gloves",
      },
      allocation: {
        id: -995312,
        partner: {
          id: -995411,
          name: "Clinique Esperance",
        },
        distribution: {
          id: -995511,
          pending: false,
        },
      },
    },
  ],
};

type ShipmentsTableProps = {
  tutorialMode?: boolean;
  tutorialStep?: number | null;
};

export default function ShipmentsTable({
  tutorialMode = false,
  tutorialStep = null,
}: ShipmentsTableProps) {
  const { apiClient } = useApiClient();
  const { user } = useUser();
  const canManageShipments = hasPermission(user, "shipmentWrite");
  const canCreateSignOffs = hasPermission(user, "signoffWrite");

  const [signOffModalOpen, setSignOffModalOpen] = useState(false);
  const [selectedAllocationIds, setSelectedAllocationIds] = useState<number[]>(
    []
  );
  const [signOffPartnerId, setSignOffPartnerId] = useState<number>(0);
  const [signOffPartnerName, setSignOffPartnerName] = useState<string>("");

  const tableRef = useRef<AdvancedBaseTableHandle<Shipment>>(null);
  const shouldShowSignOffTutorialStep =
    tutorialMode &&
    (tutorialStep === SHIPMENTS_TUTORIAL_SIGN_OFF_ITEMS_STEP_INDEX ||
      tutorialStep === SHIPMENTS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX);

  const fetchTableData = useCallback(
    async (pageSize: number, page: number, filters: FilterList<Shipment>) => {
      if (tutorialMode) {
        return {
          data: [SHIPMENTS_TUTORIAL_TRACKING_SAMPLE, SHIPMENTS_TUTORIAL_READY_SAMPLE],
          total: 2,
        };
      }

      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
        isCompleted: "false",
      });
      const res = await apiClient.get<{ data: Shipment[]; total: number }>(
        `/api/shipments?${searchParams.toString()}`
      );

      return {
        data: res.data,
        total: res.total,
      };
    },
    [apiClient, tutorialMode]
  );

  useEffect(() => {
    if (!tutorialMode) {
      return;
    }
    tableRef.current?.reload();
  }, [tutorialMode]);

  useEffect(() => {
    if (!tutorialMode) {
      return;
    }
    if (
      tutorialStep === SHIPMENTS_TUTORIAL_SIGN_OFF_ITEMS_STEP_INDEX ||
      tutorialStep === SHIPMENTS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX
    ) {
      tableRef.current?.setOpenRowIds(new Set([SHIPMENTS_TUTORIAL_READY_SAMPLE_ID]));
      return;
    }

    tableRef.current?.setOpenRowIds(new Set());
  }, [tutorialMode, tutorialStep]);

  const columns: ColumnDefinition<Shipment>[] = [
    {
      id: "donorShippingNumber",
      header: "Donor Shipping #",
      filterType: "string",
      cell: (shipment) => shipment.donorShippingNumber,
    },
    {
      id: "hfhShippingNumber",
      header: "HFH Shipping #",
      cell: (shipment) => shipment.hfhShippingNumber,
    },
    {
      id: "value",
      header: "Status",
      filterType: "enum",
      filterOptions: Object.values(shippingStatusToText),
      cell: (shipment) => <ShippingStatusTag status={shipment.value} />,
    },
    {
      id: "partners",
      header: "Partners",
      cell: (shipment) => {
        const partnerMap = new Map<number, string>();

        shipment.lineItems.forEach((item) => {
          partnerMap.set(item.allocation.partner.id, item.allocation.partner.name);
        });

        shipment.signOffs.forEach((signOff) => {
          signOff.lineItems.forEach((item) => {
            partnerMap.set(item.allocation.partner.id, item.allocation.partner.name);
          });
        });

        return Array.from(partnerMap.entries()).map(([id, name]) => (
          <Chip key={id} title={name} />
        ));
      },
    },
  ];

  if (canManageShipments || tutorialMode) {
    columns.push({
      id: "manage",
      header: "Manage",
      headerClassName: "text-right",
      cell: (shipment) => (
        <div className="flex justify-end">
          <OptionsButton
            shipment={shipment}
            fetchTableData={tableRef.current?.reload ?? (() => undefined)}
            tutorialMode={tutorialMode}
            tutorialStep={tutorialStep}
          />
        </div>
      ),
    });
  }

  return (
    <>
      <AdvancedBaseTable
        ref={tableRef}
        columns={columns}
        fetchFn={fetchTableData}
        rowId="id"
        rowBody={(shipment) => (
          <ShipmentsLineItemChipGroup
            shipment={shipment}
            canCreateSignOffs={canCreateSignOffs}
            tutorialPresetSelectedItemIds={
              shouldShowSignOffTutorialStep
                ? SHIPMENTS_TUTORIAL_READY_SELECTED_LINE_ITEM_IDS
                : undefined
            }
            tutorialSignOffButtonId={
              shouldShowSignOffTutorialStep
                ? "distributions-signoff-items-button"
                : undefined
            }
            tutorialForceShowSignOffButton={shouldShowSignOffTutorialStep}
            tutorialDisableSignOffAction={shouldShowSignOffTutorialStep}
            onSignOffClick={(allocationIds, partnerId, partnerName) => {
              setSelectedAllocationIds(allocationIds);
              setSignOffPartnerId(partnerId);
              setSignOffPartnerName(partnerName);
              setSignOffModalOpen(true);
            }}
          />
        )}
        getRowAttributes={(shipment) => {
          if (!tutorialMode) {
            return undefined;
          }
          if (shipment.id === SHIPMENTS_TUTORIAL_TRACKING_SAMPLE_ID) {
            return { "data-tutorial": "distributions-sample-shipment-row" };
          }
          if (shipment.id === SHIPMENTS_TUTORIAL_READY_SAMPLE_ID) {
            return { "data-tutorial": "distributions-ready-shipment-row" };
          }
          return undefined;
        }}
      />
      <SignOffModal
        isOpen={signOffModalOpen}
        onClose={() => {
          setSignOffModalOpen(false);
          setSelectedAllocationIds([]);
        }}
        onSuccess={() => {
          tableRef.current?.reload();
        }}
        selectedAllocationIds={selectedAllocationIds}
        partnerId={signOffPartnerId}
        partnerName={signOffPartnerName}
      />
    </>
  );
}

function OptionsButton({
  shipment,
  fetchTableData,
  tutorialMode = false,
  tutorialStep = null,
}: {
  shipment: Shipment;
  fetchTableData: () => void;
  tutorialMode?: boolean;
  tutorialStep?: number | null;
}) {
  const [isBaseDropdownOpen, setIsBaseDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isHfhModalOpen, setIsHfhModalOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTutorialTrackingShipment =
    tutorialMode && shipment.id === SHIPMENTS_TUTORIAL_TRACKING_SAMPLE_ID;
  const showBaseTutorialMenu =
    isTutorialTrackingShipment &&
    tutorialStep === SHIPMENTS_TUTORIAL_TRACK_SHIPMENTS_STEP_INDEX;
  const showStatusTutorialMenu =
    isTutorialTrackingShipment &&
    tutorialStep === SHIPMENTS_TUTORIAL_READY_FOR_DISTRIBUTION_STEP_INDEX;

  if (showBaseTutorialMenu) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100"
          aria-label="Open shipment options"
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
          <div data-tutorial="distributions-track-shipments-menu">
            <button
              type="button"
              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-900 cursor-default"
            >
              <Clock size={16} className="mr-3 flex-shrink-0" />
              <p>Change Status</p>
            </button>
            <button
              type="button"
              data-tutorial="distributions-track-shipments-hfh-option"
              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-900 cursor-default"
            >
              <Pencil size={16} className="mr-3 flex-shrink-0" />
              <p>Edit HFH Shipping #</p>
            </button>
          </div>
        </Portal>
      </div>
    );
  }

  if (showStatusTutorialMenu) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className="px-2 py-1 rounded hover:bg-gray-100"
          aria-label="Open shipment status options"
        >
          <DotsThree size={16} />
        </button>
        <Portal
          isOpen={true}
          onClose={() => undefined}
          triggerRef={buttonRef}
          position="bottom-right"
          closeOnOutsideClick={false}
          className="w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-2"
        >
          <div className="px-3 pb-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Change Status
          </div>
          <div className="py-1">
            {Object.values(shippingStatusToText).map((label) => (
              <div
                key={label}
                data-tutorial={
                  label === "Ready for Distribution"
                    ? "distributions-ready-for-distribution-option"
                    : undefined
                }
                className="px-3 py-1.5 text-sm text-gray-700"
              >
                {label}
              </div>
            ))}
          </div>
        </Portal>
      </div>
    );
  }

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
          onClick={(e) => {
            e.stopPropagation();
            setIsStatusDropdownOpen(true);
            setIsBaseDropdownOpen(false);
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors duration-150 hover:bg-gray-50 text-gray-900 cursor-pointer"
        >
          <Clock size={16} className="mr-3 flex-shrink-0" />
          <p>Change Status</p>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsHfhModalOpen(true);
            setIsBaseDropdownOpen(false);
          }}
          className="flex items-center w-full px-4 py-2 text-sm text-left transition-colors duration-150 hover:bg-gray-50 text-gray-900 cursor-pointer"
        >
          <Pencil size={16} className="mr-3 flex-shrink-0" />
          <p>Edit HFH Shipping #</p>
        </button>
      </Portal>
      <Portal
        isOpen={isStatusDropdownOpen}
        onClose={() => setIsStatusDropdownOpen(false)}
        triggerRef={buttonRef}
        position="bottom-right"
        className="bg-white border border-gray-primary/20 rounded shadow-lg p-2 text-sm w-1/5"
      >
        <div onClick={(e) => e.stopPropagation()}>
          <ChangeShippingStatusMenu
            shipment={shipment}
            fetchTableData={fetchTableData}
            back={() => {
              setIsBaseDropdownOpen(true);
              setIsStatusDropdownOpen(false);
            }}
          />
        </div>
      </Portal>

      <EditHfhShippingNumberModal
        isOpen={isHfhModalOpen}
        onClose={() => setIsHfhModalOpen(false)}
        onSuccess={() => fetchTableData()}
        shipmentId={shipment.id}
        currentHfhShippingNumber={shipment.hfhShippingNumber}
      />
    </div>
  );
}
