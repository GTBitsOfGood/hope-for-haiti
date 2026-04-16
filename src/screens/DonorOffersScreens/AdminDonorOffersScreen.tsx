"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  DotsThree,
  Plus,
  PencilSimple,
  Upload,
  Archive,
  FileCsv
} from "@phosphor-icons/react";
import { DonorOfferState } from "@prisma/client";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { AdminDonorOffersResponse, AdminDonorOffer } from "@/types/api/donorOffer.types";
import AdvancedBaseTable, {
  AdvancedBaseTableHandle,
  FilterList,
  ColumnDefinition,
} from "@/components/baseTable/AdvancedBaseTable";
import Portal from "@/components/baseTable/Portal";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/userUtils";
import { useApiClient } from "@/hooks/useApiClient";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";
import { TUTORIAL_ADMIN_DONOR_OFFERS_SAMPLE_ID } from "@/util/tutorialIds";

enum StatusFilterKey {
  UNFINALIZED = "Unfinalized",
  FINALIZED = "Finalized",
  ARCHIVED = "Archived",
}

const statusFilterTabs = [
  StatusFilterKey.UNFINALIZED,
  StatusFilterKey.FINALIZED,
  StatusFilterKey.ARCHIVED,
] as const;

const DONOR_OFFERS_TUTORIAL_SAMPLE_ID =
  TUTORIAL_ADMIN_DONOR_OFFERS_SAMPLE_ID;
const DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ID = -970002;
const DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_TUTORIAL_ID =
  "donor-offers-allocate-line-items";
const DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ROW_TUTORIAL_ID =
  "donor-offers-finalized-sample-offer";
const DONOR_OFFERS_TUTORIAL_CREATE_BUTTON_STEP_INDEX = 1;
const DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_STEP_INDEX = 2;
const DONOR_OFFERS_TUTORIAL_ALLOCATE_STEP_INDEX = 5;
const DONOR_OFFERS_TUTORIAL_ARCHIVE_STEP_INDEX = 6;
const DONOR_OFFERS_TUTORIAL_COMPLETED_STEP_INDEX = 7;
const DONOR_OFFERS_TUTORIAL_FINALIZE_STEP_INDEX = 4;
const DONOR_OFFERS_TUTORIAL_CREATE_BUTTON_HIGHLIGHT_CLASS =
  "donor-offers-tutorial-create-highlight";
const DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS =
  "donor-offers-tutorial-sample-highlight";
const DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ROW_HIGHLIGHT_CLASS =
  "donor-offers-tutorial-finalized-sample-highlight";

function TutorialOpenedManageMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="relative flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          className="rounded-md bg-white p-1 text-gray-700 shadow-sm ring-1 ring-black/5"
          aria-label="Open donor offer options"
        >
          <DotsThree weight="bold" />
        </button>
        <Portal
          isOpen={true}
          onClose={() => undefined}
          triggerRef={buttonRef}
          position="bottom-right"
          closeOnOutsideClick={false}
          className="min-w-[13rem] overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5"
        >
          <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </Portal>
      </div>
    </div>
  );
}

function mapTabToDonorOfferState(activeTab: string): DonorOfferState {
  switch (activeTab) {
    case StatusFilterKey.FINALIZED:
      return DonorOfferState.FINALIZED;
    case StatusFilterKey.ARCHIVED:
      return DonorOfferState.ARCHIVED;
    case StatusFilterKey.UNFINALIZED:
    default:
      return DonorOfferState.UNFINALIZED;
  }
}

export default function AdminDonorOffersScreen() {
  const [activeTab, setActiveTab] = useState<string>(
    StatusFilterKey.UNFINALIZED
  );
  const router = useRouter();
  const { user, loading } = useUser();
  const {apiClient} = useApiClient();
  const canManageOffers = hasPermission(user, "offerWrite");

  const tableRef = useRef<AdvancedBaseTableHandle<AdminDonorOffer>>(null);
  const hasDonorOffersTutorialEndedRef = useRef(false);
  const [hasResolvedDonorOffersTutorialState, setHasResolvedDonorOffersTutorialState] =
    useState(false);
  const [
    hasLocalDonorOffersTutorialCompletion,
    setHasLocalDonorOffersTutorialCompletion,
  ] = useState(false);
  const [isDonorOffersTutorialActive, setIsDonorOffersTutorialActive] =
    useState(false);
  const [hasDonorOffersTutorialEnded, setHasDonorOffersTutorialEnded] =
    useState(false);
  const [hasDonorOffersTutorialStarted, setHasDonorOffersTutorialStarted] =
    useState(false);
  const [activeTutorialStep, setActiveTutorialStep] = useState<number | null>(
    null
  );
  const isDonorOffersTutorialSampleMode =
    Boolean(
      user &&
        hasResolvedDonorOffersTutorialState &&
        isDonorOffersTutorialActive &&
        !hasDonorOffersTutorialEnded &&
        (hasDonorOffersTutorialStarted || !user.adminDonorOffersTutorial) &&
        !hasLocalDonorOffersTutorialCompletion
    );
  const isTutorialManageMenuStep =
    isDonorOffersTutorialSampleMode &&
    activeTutorialStep !== null &&
    activeTutorialStep >= DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_STEP_INDEX &&
    activeTutorialStep <= DONOR_OFFERS_TUTORIAL_FINALIZE_STEP_INDEX;
  const isTutorialFinalizedManageMenuStep =
    isDonorOffersTutorialSampleMode &&
    activeTutorialStep !== null &&
    activeTutorialStep >= DONOR_OFFERS_TUTORIAL_ALLOCATE_STEP_INDEX &&
    activeTutorialStep <= DONOR_OFFERS_TUTORIAL_COMPLETED_STEP_INDEX;

  const clearDonorOffersTutorialHighlights = useCallback(() => {
    document.body.classList.remove(
      DONOR_OFFERS_TUTORIAL_CREATE_BUTTON_HIGHLIGHT_CLASS
    );
    document.body.classList.remove(
      DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS
    );
    document.body.classList.remove(
      DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ROW_HIGHLIGHT_CLASS
    );
  }, []);

  const getHasLocalDonorOffersTutorialCompletion = useCallback(() => {
    if (!user?.id) {
      return false;
    }

    try {
      return (
        localStorage.getItem(`tutorial-completed:${user.id}:adminDonorOffers`) ===
        "1"
      );
    } catch {
      return false;
    }
  }, [user?.id]);

  const handleTutorialStepChange = useCallback(
    (stepIndex: number) => {
      if (hasDonorOffersTutorialEndedRef.current || hasDonorOffersTutorialEnded) {
        return;
      }

      const hasLocalCompletion = getHasLocalDonorOffersTutorialCompletion();
      setHasLocalDonorOffersTutorialCompletion(hasLocalCompletion);
      setIsDonorOffersTutorialActive(!hasLocalCompletion);
      setHasDonorOffersTutorialStarted(!hasLocalCompletion);
      clearDonorOffersTutorialHighlights();

      if (hasLocalCompletion) {
        setActiveTutorialStep(null);
        return;
      }

      setActiveTutorialStep(stepIndex);

      if (
        stepIndex >= DONOR_OFFERS_TUTORIAL_ALLOCATE_STEP_INDEX &&
        stepIndex <= DONOR_OFFERS_TUTORIAL_ARCHIVE_STEP_INDEX &&
        activeTab !== StatusFilterKey.FINALIZED
      ) {
        setActiveTab(StatusFilterKey.FINALIZED);
      } else if (
        stepIndex <= DONOR_OFFERS_TUTORIAL_FINALIZE_STEP_INDEX &&
        activeTab !== StatusFilterKey.UNFINALIZED
      ) {
        setActiveTab(StatusFilterKey.UNFINALIZED);
      }

      if (stepIndex === DONOR_OFFERS_TUTORIAL_CREATE_BUTTON_STEP_INDEX) {
        document.body.classList.add(
          DONOR_OFFERS_TUTORIAL_CREATE_BUTTON_HIGHLIGHT_CLASS
        );
      }

      if (stepIndex === DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_STEP_INDEX) {
        document.body.classList.add(
          DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_HIGHLIGHT_CLASS
        );
      }

      if (stepIndex === DONOR_OFFERS_TUTORIAL_ALLOCATE_STEP_INDEX) {
        document.body.classList.add(
          DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ROW_HIGHLIGHT_CLASS
        );
      }
    },
    [
      activeTab,
      clearDonorOffersTutorialHighlights,
      getHasLocalDonorOffersTutorialCompletion,
      hasDonorOffersTutorialEnded,
    ]
  );

  const handleTutorialEnd = useCallback(() => {
    hasDonorOffersTutorialEndedRef.current = true;
    setHasDonorOffersTutorialEnded(true);
    setIsDonorOffersTutorialActive(false);
    setHasDonorOffersTutorialStarted(false);
    setActiveTutorialStep(null);
    clearDonorOffersTutorialHighlights();
    tableRef.current?.reload();
  }, [clearDonorOffersTutorialHighlights]);

  useEffect(() => {
    if (loading) {
      setHasResolvedDonorOffersTutorialState(false);
      return;
    }

    if (!user?.id) {
      setHasLocalDonorOffersTutorialCompletion(false);
      setIsDonorOffersTutorialActive(false);
      setHasResolvedDonorOffersTutorialState(true);
      return;
    }

    try {
      const hasLocalCompletion = getHasLocalDonorOffersTutorialCompletion();
      setHasLocalDonorOffersTutorialCompletion(hasLocalCompletion);
      setIsDonorOffersTutorialActive((currentValue) =>
        hasDonorOffersTutorialStarted
          ? currentValue || !hasLocalCompletion
          : !user.adminDonorOffersTutorial && !hasLocalCompletion
      );
    } catch {
      setHasLocalDonorOffersTutorialCompletion(false);
      setIsDonorOffersTutorialActive((currentValue) =>
        hasDonorOffersTutorialStarted ? currentValue : !user.adminDonorOffersTutorial
      );
    }
    setHasResolvedDonorOffersTutorialState(true);
  }, [
    getHasLocalDonorOffersTutorialCompletion,
    hasDonorOffersTutorialStarted,
    loading,
    user?.adminDonorOffersTutorial,
    user?.id,
  ]);

  useEffect(() => {
    if (!hasDonorOffersTutorialEnded) {
      return;
    }

    setIsDonorOffersTutorialActive(false);
    setHasDonorOffersTutorialStarted(false);
    setActiveTutorialStep(null);
    clearDonorOffersTutorialHighlights();
    tableRef.current?.reload();
  }, [clearDonorOffersTutorialHighlights, hasDonorOffersTutorialEnded]);

  useEffect(() => {
    return () => {
      clearDonorOffersTutorialHighlights();
    };
  }, [clearDonorOffersTutorialHighlights]);

  const fetchFn = useCallback(
    async(pageSize: number, page: number, filters: FilterList<AdminDonorOffer>) => {
      if (isDonorOffersTutorialSampleMode) {
        const now = new Date();
        const responseDeadline = new Date(now);
        responseDeadline.setDate(now.getDate() + 7);
        const donorResponseDeadline = new Date(now);
        donorResponseDeadline.setDate(now.getDate() + 14);

        if (activeTab === StatusFilterKey.FINALIZED) {
          return {
            data: [
              {
                donorOfferId: DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ID,
                offerName: "Test Donor Offer.csv",
                donorName: "Test Donor",
                responseDeadline,
                donorResponseDeadline,
                state: DonorOfferState.FINALIZED,
                invitedPartners: [
                  { name: "Hope Medical Center", responded: true },
                  { name: "Les Cayes Community Hospital", responded: true },
                ],
              },
            ],
            total: 1,
          };
        }

        return {
          data: [
            {
              donorOfferId: DONOR_OFFERS_TUTORIAL_SAMPLE_ID,
              offerName: "Test Donor Offer.csv",
              donorName: "Test Donor",
              responseDeadline,
              donorResponseDeadline,
              state: mapTabToDonorOfferState(activeTab),
              invitedPartners: [
                { name: "Hope Medical Center", responded: false },
                { name: "Les Cayes Community Hospital", responded: true },
              ],
            },
          ],
          total: 1,
        };
      }

      const combinedFilters = {
        ...filters, 
        state: {type: "enum" as const, values: [activeTab]},
      };

      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        page: page.toString(), 
        filters: JSON.stringify(combinedFilters),
      });

      const data = await apiClient.get<AdminDonorOffersResponse>(
        `/api/donorOffers?${params}`
      );

      return {
        data: data.donorOffers,
        total: data.total,
      };
    },
    [apiClient, activeTab, isDonorOffersTutorialSampleMode]
  );

  const handleArchive = (donorOfferId: number) => {
    (async () => {
      try {
        const resp = await fetch(`/api/donorOffers/${donorOfferId}/submit`, {
          method: "POST",
        });
        if (!resp.ok) {
          toast.error("Error archiving donor offer");
          return;
        }
        toast.success("Donor offer archived");
        tableRef.current?.reload();
      } catch (error) {
        toast.error("Error archiving donor offer");
        console.error("Archive error:", error);
      }
    })();
  };

  const handleConvertToCsv = useCallback(async (donorOfferId: number) => {
    const loadingToastId = toast.loading("Generating CSV...");

    try {
      const response = await fetch(`/api/donorOffers/${donorOfferId}/csv`);

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        let errorMessage = "Failed to generate CSV";

        if (contentType.includes("application/json")) {
          const body = (await response.json()) as { error?: string; message?: string };
          errorMessage = body.error ?? body.message ?? errorMessage;
        } else {
          const body = (await response.text()).trim();
          if (body) {
            errorMessage = body;
          }
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("content-disposition");
      const fileName =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ??
        `donor-offer-${donorOfferId}.csv`;

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      toast.dismiss(loadingToastId);
      toast.success("CSV downloaded");
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate CSV"
      );
    }
  }, []);

  const columns: ColumnDefinition<AdminDonorOffer>[] = [
    {
      id: "offerName",
      header: "Donor Offer", 
      filterType: "string", 
      cell: (offer) => offer.offerName,
    },
    {
      id: "donorName",
      header: "Donor Name",
      filterType: "string",
      cell: (offer) => offer.donorName, 
    },
    {
      id: "partnerInvolved",
      header: "Partner Involved", 
      filterType: "string",
      cell: (offer) => 
        offer.invitedPartners.map((p) => p.name).join(", "),
      hidden: true, 
    },
    ...(activeTab === StatusFilterKey.UNFINALIZED
      ? [
          {
            id: "responseDeadline",
            header: "Response Deadline",
            filterType: "date" as const, 
            cell: (offer: AdminDonorOffer) => 
              offer.responseDeadline
                ? new Date(offer.responseDeadline).toLocaleDateString()
                : "N/A",
          },
          {
            id: "partnersResponded",
            header: "Partners Responded", 
            cell: (offer: AdminDonorOffer) => 
              `${offer.invitedPartners.filter((p) => p.responded).length}/${offer.invitedPartners.length}`, 
          },
          {
            id: "donorResponseDeadline",
            header: "Donor Response Deadline", 
            filterType: "date" as const, 
            hidden: true, 
            cell: (offer: AdminDonorOffer) => 
              offer.donorResponseDeadline 
                ? new Date(offer.donorResponseDeadline).toLocaleDateString() 
                : "N/A"
            
          },
          {
            id: "allPartnersResponded",
            header: "All Partners Responded", 
            filterType: "enum" as const, 
            filterOptions: ["Yes", "No"],
            hidden: true, 
            cell: (offer: AdminDonorOffer) => 
              offer.invitedPartners.length > 0 && 
              offer.invitedPartners.every((p) => p.responded)
                ? "Yes"
                : "No",
          },
      ]
      : [])
  ];

  if (canManageOffers) {
    columns.push({
      id: "manage",
      header: "Manage",
      headerClassName: "text-right",
      filterable: false,
      cell: (offer) => {
        const isTutorialSampleOffer =
          isDonorOffersTutorialSampleMode &&
          offer.donorOfferId === DONOR_OFFERS_TUTORIAL_SAMPLE_ID;
        const isTutorialFinalizedSampleOffer =
          isDonorOffersTutorialSampleMode &&
          offer.donorOfferId === DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ID;

        if (isTutorialSampleOffer && isTutorialManageMenuStep) {
          return (
            <TutorialOpenedManageMenu>
              <button
                type="button"
                className="flex w-full cursor-default px-3 py-2 text-left text-sm text-gray-700"
              >
                <PencilSimple className="mr-2 inline-block" size={22} />
                Edit Offer Details
              </button>
              <button
                type="button"
                data-tutorial="donor-offers-csv-file"
                className="flex w-full cursor-default px-3 py-2 text-left text-sm text-gray-700"
              >
                <FileCsv className="mr-2 inline-block" size={22} />
                Convert to CSV
              </button>
              <button
                type="button"
                data-tutorial="donor-offers-finalize-offer"
                className="flex w-full cursor-default px-3 py-2 text-left text-sm text-gray-700"
              >
                <Upload className="mr-2 inline-block" size={22} />
                Upload Final Offer
              </button>
            </TutorialOpenedManageMenu>
          );
        }

        if (isTutorialFinalizedSampleOffer && isTutorialFinalizedManageMenuStep) {
          return (
            <TutorialOpenedManageMenu>
              <button
                type="button"
                data-tutorial="donor-offers-archive-offer"
                className="flex w-full cursor-default px-3 py-2 text-left text-sm text-gray-700"
              >
                <Archive className="mr-2 inline-block" size={22} />
                Archive Offer
              </button>
            </TutorialOpenedManageMenu>
          );
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Menu as="div" className="flex justify-end relative">
              <MenuButton>
                <DotsThree weight="bold" />
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="z-10 rounded-md bg-white ring-1 shadow-lg ring-black/5 w-max"
              >
                {offer.state !== DonorOfferState.ARCHIVED && (
                  <MenuItem
                    as="button"
                    className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      if (offer.donorOfferId === DONOR_OFFERS_TUTORIAL_SAMPLE_ID) {
                        return;
                      }
                      router.push(`/donorOffers/${offer.donorOfferId}/edit`);
                    }}
                  >
                    <PencilSimple className="inline-block mr-2" size={22} />
                    Edit Offer Details
                  </MenuItem>
                )}
                {offer.state === DonorOfferState.UNFINALIZED && (
                  <MenuItem
                    as="button"
                    className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      if (offer.donorOfferId === DONOR_OFFERS_TUTORIAL_SAMPLE_ID) {
                        return;
                      }
                      router.push(`/donorOffers/${offer.donorOfferId}/finalize`);
                    }}
                  >
                    <Upload className="inline-block mr-2" size={22} />
                    Upload Final Offer
                  </MenuItem>
                )}
                {offer.state === DonorOfferState.UNFINALIZED && (
                  <MenuItem
                    as="button"
                    className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      if (offer.donorOfferId === DONOR_OFFERS_TUTORIAL_SAMPLE_ID) {
                        return;
                      }
                      void handleConvertToCsv(offer.donorOfferId);
                    }}
                  >
                    <FileCsv className="inline-block mr-2" size={22} />
                    Convert to CSV
                  </MenuItem>
                )}
                {offer.state === DonorOfferState.FINALIZED && (
                  <MenuItem
                    as="button"
                    className="flex w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      if (offer.donorOfferId === DONOR_OFFERS_TUTORIAL_SAMPLE_ID) {
                        return;
                      }
                      handleArchive(offer.donorOfferId);
                    }}
                  >
                    <Archive className="inline-block mr-2" size={22} />
                    Archive Offer
                  </MenuItem>
                )}
                {offer.state === DonorOfferState.ARCHIVED && (
                  <MenuItem
                    as="div"
                    className="flex w-full px-3 py-2 text-sm text-gray-500 italic cursor-default"
                  >
                    Archived (Read-Only)
                  </MenuItem>
                )}
              </MenuItems>
            </Menu>
          </div>
        );
      },
    });
  }

  const tutorialSteps = useMemo<TutorialStep[]>(() => [
    {
      target: "body",
      title: <div>Track Donations!</div>,
      content: (
        <div>
          Your central hub for managing incoming donations. Coordinate between
          donors and partners to move resources efficiently.
        </div>
      ),
      placement: "center",
      isFixed: true,
    },
    {
      target: `[data-tutorial="donor-offers-initial-offer"]`,
      title: <div>Create an Initial Offer</div>,
      content: (
        <div>
          Identify the donor, set a response deadline, select which partners
          can request the supplies, and upload the Excel offer sheet.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 4,
    },
    {
      target: `[data-tutorial="donor-offers-allocate-line-items"]`,
      title: <div>Revise Allocations</div>,
      content: (
        <div>
          This example offer was created from <b>Test Donor Offer.csv</b>. Click
          the offer row to open the resulting page, then review and revise
          partner requests per item.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
    {
      target: '[data-tutorial=\"donor-offers-csv-file\"]',
      title: <div>Generating CSV File</div>,
      content: (
        <div>
          Use this option to generate a CSV file of the revised requests so you
          can review or share them outside the platform.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
    {
      target: '[data-tutorial=\"donor-offers-finalize-offer\"]',
      title: <div>Finalize Offer</div>,
      content: (
        <div>
          Click this button to upload the final version of the donor’s offer,
          which will move to the Finalized tab.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
    {
      target: `[data-tutorial="donor-offers-finalized-sample-offer"]`,
      title: <div>Allocate Line Items</div>,
      content: (
        <div>
          Toggle between item and partner views to manually map line items to
          specific pallets. Use Suggest Allocations to automatically link
          available inventory to pending hospital requests.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
    {
      target: `[data-tutorial="donor-offers-archive-offer"]`,
      title: <div>Archive Offer</div>,
      content: (
        <div>
          After a donor offer is fully allocated, click here to archive it.”
          View all Archived offers in the Archived tab!
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
    {
      target: "body",
      title: <div>Tutorial Completed</div>,
      content: <div>You are now ready to manage incoming donations!</div>,
      placement: "center",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
  ], []);

  return (
    <>
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="adminDonorOffers"
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />
      <h1 className="text-2xl font-semibold">Donor Offers</h1>
      <div className="flex space-x-4 mt-4 border-b-2">
        <div className="flex-1">
          {statusFilterTabs.map((tab) => (
            <button
              key={tab}
              data-tutorial={
                tab === StatusFilterKey.FINALIZED
                  ? "donor-offers-finalized-tab"
                  : tab === StatusFilterKey.ARCHIVED
                    ? "donor-offers-archived-tab"
                    : undefined
              }
              data-active={activeTab === tab}
              className="px-2 py-1 text-md font-medium relative -mb-px transition-colors focus:outline-none data-[active=true]:border-b-2 data-[active=true]:border-black data-[active=true]:bottom-[-1px] data-[active=false]:text-gray-500"
              onClick={() => setActiveTab(tab)}
            >
              <div className="hover:bg-gray-100 px-2 py-1 rounded">{tab}</div>
            </button>
          ))}
        </div>
      </div>

      {hasResolvedDonorOffersTutorialState ? (
        <AdvancedBaseTable
          key={
            isDonorOffersTutorialSampleMode
              ? "donor-offers-tutorial-sample"
              : "donor-offers-live-data"
          }
          ref={tableRef}
          columns={columns}
          fetchFn={fetchFn}
          rowId="donorOfferId"
          onRowClick={(offer) => {
            if (
              isDonorOffersTutorialSampleMode &&
              offer.donorOfferId === DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ID
            ) {
              return;
            }

            router.push(`/donorOffers/${offer.donorOfferId}`);
          }}
          getRowAttributes={(offer) =>
            isDonorOffersTutorialSampleMode &&
            offer.donorOfferId === DONOR_OFFERS_TUTORIAL_SAMPLE_ID
              ? { "data-tutorial": DONOR_OFFERS_TUTORIAL_SAMPLE_ROW_TUTORIAL_ID }
              : isDonorOffersTutorialSampleMode &&
                  offer.donorOfferId === DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ID
                ? {
                    "data-tutorial":
                      DONOR_OFFERS_TUTORIAL_FINALIZED_SAMPLE_ROW_TUTORIAL_ID,
                  }
                : undefined
          }
          toolBar={
            canManageOffers && (
              <button
                className="order-1 ml-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition"
                onClick={() => router.push("/donorOffers/create")}
                data-tutorial="donor-offers-initial-offer"
              >
                <Plus size={18} /> + Donor Offer
              </button>
            )
          }
        />
      ) : null}
    </>
  );
}
