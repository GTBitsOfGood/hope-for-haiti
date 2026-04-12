"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DistributionTable from "@/components/DistributionTable";
import ShipmentsTable from "@/components/ShipmentsTable";
import SignOffsTable from "@/components/SignOffsTable";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";
import { useRouter } from "next/navigation";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";

enum DistributionTab {
  DISTRIBUTIONS = "Distributions",
  SHIPMENTS = "Shipments",
  SIGNOFFS = "Sign-offs",
}

const DISTRIBUTIONS_TUTORIAL_EDIT_STEP_INDEX = 1;
const DISTRIBUTIONS_TUTORIAL_TRACK_SHIPMENTS_STEP_INDEX = 2;
const DISTRIBUTIONS_TUTORIAL_READY_FOR_DISTRIBUTION_STEP_INDEX = 3;
const DISTRIBUTIONS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX = 5;
const DISTRIBUTIONS_TUTORIAL_TOOLTIP_SELECTOR = '[data-tutorial-tooltip="true"]';
const DISTRIBUTIONS_SIGNOFFS_TAB_TUTORIAL_ID = "distributions-signoffs-tab";
const DISTRIBUTIONS_SIGNOFFS_TAB_HIGHLIGHT_CLASS =
  "distributions-tutorial-signoffs-tab-highlight";

export default function AdminDistributionsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const canViewDistributions = hasPermission(user, "distributionRead");
  const canViewShipments = hasPermission(user, "shipmentRead");
  const canViewSignOffs = hasPermission(user, "shipmentRead");

  const availableTabs = useMemo(
    () =>
      [
        canViewDistributions ? DistributionTab.DISTRIBUTIONS : null,
        canViewShipments ? DistributionTab.SHIPMENTS : null,
        canViewSignOffs ? DistributionTab.SIGNOFFS : null,
      ].filter(Boolean) as DistributionTab[],
    [canViewDistributions, canViewShipments, canViewSignOffs]
  );

  const [activeTab, setActiveTab] = useState<string>(availableTabs[0] ?? "");
  const hasDistributionsTutorialEndedRef = useRef(false);
  const [isDistributionsTutorialActive, setIsDistributionsTutorialActive] =
    useState(true);
  const [hasDistributionsTutorialEnded, setHasDistributionsTutorialEnded] =
    useState(false);
  const [activeTutorialStep, setActiveTutorialStep] = useState<number | null>(
    null
  );
  const isDistributionsTutorialSampleMode =
    isDistributionsTutorialActive && !hasDistributionsTutorialEnded;
  const shouldDisableDistributionsTutorialAutoScroll =
    activeTutorialStep === DISTRIBUTIONS_TUTORIAL_TRACK_SHIPMENTS_STEP_INDEX ||
    activeTutorialStep ===
      DISTRIBUTIONS_TUTORIAL_READY_FOR_DISTRIBUTION_STEP_INDEX;

  const clearDistributionsTutorialHighlights = useCallback(() => {
    document.body.classList.remove(DISTRIBUTIONS_SIGNOFFS_TAB_HIGHLIGHT_CLASS);
  }, []);

  useEffect(() => {
    if (availableTabs.length === 0) {
      router.replace("/");
      return;
    }
    if (!availableTabs.includes(activeTab as DistributionTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs, router]);

  const tutorialSteps = useMemo<TutorialStep[]>(
    () => [
      {
        target: "body",
        title: <div>Manage Resource Movement!</div>,
        content: (
          <div>
            This is where you track the transition of supplies from initial
            planning to final delivery. Use the tabs to navigate between Active
            Distributions, Shipments, and Sign-offs.
          </div>
        ),
        placement: "center",
        isFixed: true,
      },
      {
        target: '[data-tutorial="distributions-edit-approve-option"]',
        title: <div>Edit Distributions</div>,
        content: (
          <div>
            Transfer line items between pending distributions. Once you are
            ready to move forward, approve it!
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 4,
      },
      {
        target: '[data-tutorial="distributions-track-shipments-menu"]',
        title: <div>Track Shipments</div>,
        content: (
          <div>
            In the Shipments tab, you can add an HFH Shipping Number and
            manually update the status as items move from the donor to the
            distribution center.
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
      {
        target: '[data-tutorial="distributions-ready-for-distribution-option"]',
        title: <div>Ready for Distribution</div>,
        content: (
          <div>
            Once a shipment reaches the HfH center, update its status to
            &apos;Ready for Distribution.&apos; This notifies the partner that
            their supplies are available for pickup.
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
      {
        target: '[data-tutorial="distributions-signoff-items-button"]',
        title: <div>Sign off Items</div>,
        content: (
          <div>
            When a partner arrives, click &apos;SignOff Items&apos; to begin the
            hand-off. You can sign off items individually or group them together
            for a faster checkout.
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
      {
        target: `[data-tutorial="${DISTRIBUTIONS_SIGNOFFS_TAB_TUTORIAL_ID}"]`,
        title: <div>Track Past Sign-Offs</div>,
        content: (
          <div>
            View past sign-offs, including the staff who signed, signature, and
            date/time, in this tab!
          </div>
        ),
        placement: "left",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
      {
        target: "body",
        title: <div>Tutorial Completed: Distributions</div>,
        content: <div>You are now ready to manage your distributions!</div>,
        placement: "center",
        isFixed: true,
        disableBeacon: true,
        spotlightPadding: 2,
      },
    ],
    []
  );

  const handleTutorialStepChange = useCallback(
    (stepIndex: number) => {
      if (
        hasDistributionsTutorialEndedRef.current ||
        hasDistributionsTutorialEnded
      ) {
        return;
      }

      setIsDistributionsTutorialActive(true);
      setActiveTutorialStep(stepIndex);

      document.body.classList.toggle(
        DISTRIBUTIONS_SIGNOFFS_TAB_HIGHLIGHT_CLASS,
        stepIndex === DISTRIBUTIONS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX
      );

      if (
        stepIndex <= DISTRIBUTIONS_TUTORIAL_EDIT_STEP_INDEX &&
        activeTab !== DistributionTab.DISTRIBUTIONS
      ) {
        setActiveTab(DistributionTab.DISTRIBUTIONS);
      } else if (
        stepIndex >= DISTRIBUTIONS_TUTORIAL_TRACK_SHIPMENTS_STEP_INDEX &&
        stepIndex <= DISTRIBUTIONS_TUTORIAL_TRACK_PAST_SIGN_OFFS_STEP_INDEX &&
        activeTab !== DistributionTab.SHIPMENTS
      ) {
        setActiveTab(DistributionTab.SHIPMENTS);
      }
    },
    [activeTab, hasDistributionsTutorialEnded]
  );

  const handleTutorialEnd = useCallback(() => {
    hasDistributionsTutorialEndedRef.current = true;
    setHasDistributionsTutorialEnded(true);
    setIsDistributionsTutorialActive(false);
    setActiveTutorialStep(null);
    clearDistributionsTutorialHighlights();
  }, [clearDistributionsTutorialHighlights]);

  useEffect(() => {
    if (!hasDistributionsTutorialEnded) {
      return;
    }

    setIsDistributionsTutorialActive(false);
    setActiveTutorialStep(null);
    clearDistributionsTutorialHighlights();
  }, [clearDistributionsTutorialHighlights, hasDistributionsTutorialEnded]);

  useEffect(() => {
    if (!isDistributionsTutorialActive || hasDistributionsTutorialEnded) {
      return;
    }

    let pendingCleanupTimeout: number | null = null;

    const maybeScheduleCleanup = () => {
      const hasTooltip = Boolean(
        document.querySelector(DISTRIBUTIONS_TUTORIAL_TOOLTIP_SELECTOR)
      );

      if (hasTooltip) {
        if (pendingCleanupTimeout !== null) {
          window.clearTimeout(pendingCleanupTimeout);
          pendingCleanupTimeout = null;
        }
        return;
      }

      if (pendingCleanupTimeout !== null) {
        return;
      }

      pendingCleanupTimeout = window.setTimeout(() => {
        pendingCleanupTimeout = null;

        if (!document.querySelector(DISTRIBUTIONS_TUTORIAL_TOOLTIP_SELECTOR)) {
          hasDistributionsTutorialEndedRef.current = true;
          setHasDistributionsTutorialEnded(true);
          setIsDistributionsTutorialActive(false);
          setActiveTutorialStep(null);
          clearDistributionsTutorialHighlights();
        }
      }, 200);
    };

    maybeScheduleCleanup();

    const observer = new MutationObserver(maybeScheduleCleanup);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (pendingCleanupTimeout !== null) {
        window.clearTimeout(pendingCleanupTimeout);
      }
    };
  }, [
    clearDistributionsTutorialHighlights,
    hasDistributionsTutorialEnded,
    isDistributionsTutorialActive,
  ]);

  useEffect(() => {
    return () => {
      clearDistributionsTutorialHighlights();
    };
  }, [clearDistributionsTutorialHighlights]);

  if (availableTabs.length === 0) {
    return null;
  }

  return (
    <>
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="adminDistributions"
        disableAutoScroll={shouldDisableDistributionsTutorialAutoScroll}
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />
      <h1 className="text-2xl font-semibold text-gray-primary">Distributions</h1>

      <div className="flex space-x-4 mt-6 border-b-2 border-gray-primary border-opacity-10">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            data-tutorial={
              tab === DistributionTab.SIGNOFFS
                ? DISTRIBUTIONS_SIGNOFFS_TAB_TUTORIAL_ID
                : undefined
            }
            data-active={activeTab === tab}
            className="px-2 py-1 text-md font-medium text-gray-primary text-opacity-70 relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-gray-primary data-[active=true]:bottom-[-1px] data-[active=true]:text-opacity-100"
            onClick={() => setActiveTab(tab)}
          >
            <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
          </button>
        ))}
      </div>

      {activeTab === DistributionTab.DISTRIBUTIONS && canViewDistributions && (
        <DistributionTable
          tutorialMode={isDistributionsTutorialSampleMode}
          tutorialStep={activeTutorialStep}
        />
      )}
      {activeTab === DistributionTab.SHIPMENTS && canViewShipments && (
        <ShipmentsTable
          tutorialMode={isDistributionsTutorialSampleMode}
          tutorialStep={activeTutorialStep}
        />
      )}
      {activeTab === DistributionTab.SIGNOFFS && canViewSignOffs && (
        <SignOffsTable
          tutorialMode={isDistributionsTutorialSampleMode}
          tutorialStep={activeTutorialStep}
        />
      )}
    </>
  );
}
