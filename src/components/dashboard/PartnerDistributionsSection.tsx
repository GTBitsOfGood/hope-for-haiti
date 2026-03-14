"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Step } from "react-joyride";
import { $Enums } from "@prisma/client";
import Tutorial from "@/components/Tutorial";
import { PartnerAllocation } from "@/types/api/allocation.types";
import PartnerDistributionTable, {
  PartnerDistributionTableHandle,
} from "./PartnerDistributionTable";

type TabType = "in-progress" | "completed";

const tutorialSteps: Step[] = [
  {
    target: "body",
    title: (
      <div>
        Welcome to your <span className="text-red-primary">Dashboard!</span>
      </div>
    ),
    content:
      "Your dashboard page is where you can view your incoming and completed deliveries.",
    placement: "center",
    isFixed: true,
  },
  {
    target: '[data-tutorial="dashboard-in-progress-tab"]',
    title: "In Progress Tab",
    content: "In this tab, you will see all your incoming items.",
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
    
  },
  {
    target: '[data-tutorial="individual-item"]',
    title: "Items",
    content: (
      <div>
        <strong>This is an individual item.</strong>
        <p className="mt-2">Here you can see an item&apos;s:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Item details</li>
          <li>Quantity</li>
          <li>Shipment progress</li>
          <li>Donor offer</li>
        </ul>
      </div>
    ),
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="dashboard-completed-tab"]',
    title: "Completed Tab",
    content: "In this tab, you will see all your recently completed items.",
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: '[data-tutorial="individual-item"]',
    title: "Items",
    content: (
      <div>
        <strong>This is an individual item.</strong>
        <p className="mt-2">Here you can see an item&apos;s:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Item details</li>
          <li>Quantity</li>
          <li>Sign off date</li>
          <li>Signed off by</li>
          <li>Donor offer</li>
        </ul>
      </div>
    ),
    placement: "bottom",
    spotlightPadding: 4,
    disableBeacon: true,
  },
  {
    target: "body",
    title: (
      <div>
        Tutorial Completed: <span className="text-red-primary">Dashboard</span>
      </div>
    ),
    content: "You are now ready to track your incoming and completed deliveries.",
    placement: "center",
  },
];

const tutorialInProgressRowId = -999998;
const tutorialCompletedRowId = -999999;

export default function PartnerDistributionsSection() {
  const [activeTab, setActiveTab] = useState<TabType>("in-progress");
  const tableRef = useRef<PartnerDistributionTableHandle>(null);
  const activeTabRef = useRef<TabType>("in-progress");
  const inProgressTutorialRowInsertedRef = useRef(false);
  const completedTutorialRowInsertedRef = useRef(false);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const removeInProgressTutorialRow = useCallback(() => {
    if (!inProgressTutorialRowInsertedRef.current) return;
    tableRef.current?.removeItemById(tutorialInProgressRowId);
    inProgressTutorialRowInsertedRef.current = false;
  }, []);

  const removeCompletedTutorialRow = useCallback(() => {
    if (!completedTutorialRowInsertedRef.current) return;
    tableRef.current?.removeItemById(tutorialCompletedRowId);
    completedTutorialRowInsertedRef.current = false;
  }, []);

  const handleTutorialEnd = useCallback(() => {
    removeInProgressTutorialRow();
    removeCompletedTutorialRow();
  }, [removeCompletedTutorialRow, removeInProgressTutorialRow]);

  const getTutorialRowAttributes = useCallback(
    (item: PartnerAllocation) =>
      item.id === tutorialInProgressRowId || item.id === tutorialCompletedRowId
        ? { "data-tutorial": "individual-item" }
        : undefined,
    []
  );

  const getTutorialRowClassName = useCallback(
    (item: PartnerAllocation) =>
      item.id === tutorialInProgressRowId || item.id === tutorialCompletedRowId
        ? "!bg-white"
        : undefined,
    []
  );

  const setCurrentTab = useCallback((nextTab: TabType) => {
    activeTabRef.current = nextTab;
    setActiveTab(nextTab);
  }, []);

  const setTutorialTab = useCallback(
    (nextTab: TabType) => {
      if (activeTabRef.current !== nextTab) {
        tableRef.current?.setItems([]);
      }

      setCurrentTab(nextTab);
    },
    [setCurrentTab]
  );

  const handleTutorialStepChange = useCallback(
    (stepIndex: number) => {
      if (stepIndex !== 2) {
        removeInProgressTutorialRow();
      }

      if (stepIndex !== 4) {
        removeCompletedTutorialRow();
      }

      const nextTab: TabType = stepIndex <= 2 ? "in-progress" : "completed";
      setTutorialTab(nextTab);

      if (stepIndex === 2) {
        const ensureInProgressTutorialRow = (attempt = 0) => {
          const currentItems = tableRef.current?.getAllItems() ?? [];
          const hasTutorialRow = currentItems.some(
            (item) => item.id === tutorialInProgressRowId
          );

          if (hasTutorialRow) {
            inProgressTutorialRowInsertedRef.current = true;
            return;
          }

          const tutorialInProgressRow: PartnerAllocation = {
            id: tutorialInProgressRowId,
            generalItemTitle: "Rice Bags",
            lotNumber: "TUT-LOT-001",
            palletNumber: "TUT-PAL-001",
            boxNumber: "TUT-BOX-001",
            quantity: 12,
            donorName: "Tutorial Donor",
            shipmentStatus: $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION,
          };

          tableRef.current?.setItems((items) => [
            tutorialInProgressRow,
            ...items.filter((item) => item.id !== tutorialInProgressRowId),
          ]);
          inProgressTutorialRowInsertedRef.current = true;

          if (attempt < 150) {
            requestAnimationFrame(() =>
              ensureInProgressTutorialRow(attempt + 1)
            );
          }
        };

        ensureInProgressTutorialRow();
        return;
      }

      if (stepIndex === 4) {
        const ensureCompletedTutorialRow = (attempt = 0) => {
          const currentItems = tableRef.current?.getAllItems() ?? [];
          const hasTutorialRow = currentItems.some(
            (item) => item.id === tutorialCompletedRowId
          );

          if (hasTutorialRow) {
            completedTutorialRowInsertedRef.current = true;
            return;
          }

          const tutorialCompletedRow: PartnerAllocation = {
            id: tutorialCompletedRowId,
            generalItemTitle: "Hygiene Kits",
            lotNumber: "TUT-LOT-002",
            palletNumber: "TUT-PAL-002",
            boxNumber: "TUT-BOX-002",
            quantity: 8,
            donorName: "Tutorial Donor",
            shipmentStatus: $Enums.ShipmentStatus.READY_FOR_DISTRIBUTION,
            signOffDate: new Date(),
            signOffStaffMemberName: "Tutorial Staff",
          };

          tableRef.current?.setItems((items) => [
            tutorialCompletedRow,
            ...items.filter((item) => item.id !== tutorialCompletedRowId),
          ]);
          completedTutorialRowInsertedRef.current = true;

          if (attempt < 150) {
            requestAnimationFrame(() =>
              ensureCompletedTutorialRow(attempt + 1)
            );
          }
        };

        ensureCompletedTutorialRow();
      }
    },
    [
      removeCompletedTutorialRow,
      removeInProgressTutorialRow,
      setTutorialTab,
    ]
  );

  return (
    <div className="mb-8">
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="dashboard"
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Distributions</h2>
      </div>

      <hr className="mb-4 border-gray-200" />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <div
          data-tutorial="dashboard-in-progress-tab"
          className="inline-flex rounded-md bg-white"
        >
          <button
            onClick={() => setCurrentTab("in-progress")}
            className={`px-4 py-2 font-medium transition-colors rounded-md ${
              activeTab === "in-progress"
                ? "text-blue-primary border-b-2 border-blue-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            In Progress
          </button>
        </div>
        <div
          data-tutorial="dashboard-completed-tab"
          className="inline-flex rounded-md bg-white"
        >
          <button
            onClick={() => setCurrentTab("completed")}
            className={`px-4 py-2 font-medium transition-colors rounded-md ${
              activeTab === "completed"
                ? "text-blue-primary border-b-2 border-blue-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Table */}
      <PartnerDistributionTable
        ref={tableRef}
        pending={activeTab === "in-progress"}
        rowClassName={getTutorialRowClassName}
        getRowAttributes={getTutorialRowAttributes}
      />
    </div>
  );
}
