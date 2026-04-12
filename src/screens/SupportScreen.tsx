"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import {
  Channel,
  ChannelList,
  InfiniteScroll,
  MessageList,
  Thread,
  Window,
  useChatContext,
} from "stream-chat-react";
import type { Channel as ChannelType } from "stream-chat";
import ChannelPreview from "@/components/tickets/ChannelPreview";
import TicketChannelHeader from "@/components/tickets/TicketChannelHeader";
import TicketMessageInput from "@/components/tickets/TicketMessageInput";
import ChannelListTabs from "@/components/tickets/ChannelListTabs";
import TicketSearchBar from "@/components/tickets/TicketSearchBar";

import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { ChatCircleSlash, DotsThree, Plus } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExtraChannelData } from "@/types/api/streamio.types";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";

const LEGACY_BELL_HIGHLIGHT_CLASS = "admin-dashboard-tutorial-bell-highlight";
const SUPPORT_UNREAD_NOTIFICATIONS_STEP_INDEX = 8;
const SUPPORT_UNREAD_TAB_TUTORIAL_ID = "support-unread-notifications-tab";
const TUTORIAL_TOOLTIP_SELECTOR = '[data-tutorial-tooltip="true"]';

const SUPPORT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: "body",
    title: (
      <div>
        Welcome to <span className="text-red-primary">Partner Support!</span>
      </div>
    ),
    content: (
      <div>
        Create support tickets, upload documents, and track resolved responses.
      </div>
    ),
    placement: "center",
    isFixed: true,
  },
  {
    target: '[data-tutorial="support-left-ticket-panel"]',
    title: <div>Your Tickets</div>,
    content: (
      <div>
        This shows all of your support tickets. Select a ticket to view the
        conversation and respond to messages.
      </div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: '[data-tutorial="support-resolved-unresolved-tabs"]',
    title: <div>Ticket Status</div>,
    content: (
      <div>
        Use these tabs to switch between unresolved tickets that still need
        attention and resolved tickets that have already been closed.
      </div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: '[data-tutorial="support-search-button"]',
    title: <div>Search Tickets</div>,
    content: (
      <div>Use the search bar to quickly find a specific support ticket.</div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: '[data-tutorial="support-sample-ticket-status"]',
    title: <div>Ticket Status</div>,
    content: (
      <div>
        The status indicator shows whether the ticket is currently open or
        resolved.
      </div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: '[data-tutorial="support-sample-attachments"]',
    title: <div>Attachments</div>,
    content: <div>Click the plus to attach files to your support message.</div>,
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: '[data-tutorial="support-sample-message-options"]',
    title: <div>Message Options</div>,
    content: (
      <div>
        Click the three dots next to a message to open additional actions. From
        here you can pin the message, mark it as unread, edit it, or delete it.
      </div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: '[data-tutorial="support-resolve-ticket-trigger"]',
    title: <div>Resolve a Ticket</div>,
    content: (
      <div>
        Select this button to mark the support request as resolved. It will move
        to the Resolved tab.
      </div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
  {
    target: `[data-tutorial="${SUPPORT_UNREAD_TAB_TUTORIAL_ID}"]`,
    title: <div>Unread Notifications</div>,
    content: (
      <div>
        The number next to the Support tab shows how many unread messages or
        updates you have.
      </div>
    ),
    placement: "left",
    isFixed: true,
    disableBeacon: true,
    spotlightPadding: 4,
  },
];

function TutorialSampleTicketRow() {
  return (
    <div className="pointer-events-none absolute left-2 right-2 top-2 z-[30]">
      <div className="rounded-lg border border-gray-primary/15 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-primary">
              Tutorial Ticket
            </div>
            <div className="text-sm text-gray-primary/70">
              Les Cayes Community Hospital
            </div>
          </div>
          <div
            className="rounded p-1 text-gray-primary"
            data-tutorial="support-resolve-ticket-trigger"
          >
            <DotsThree size={16} weight="bold" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-primary/70">
          <span>Tutorial message</span>
          <span>Just now</span>
        </div>
      </div>
    </div>
  );
}

function TutorialSampleConversation() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[25] flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Tutorial Ticket</h2>
          <span className="text-sm text-gray-primary/70">
            Les Cayes Community Hospital
          </span>
          <span
            className="rounded-full bg-green-primary px-2 py-1 text-sm text-green-dark"
            data-tutorial="support-sample-ticket-status"
          >
            Open
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="mx-6 border-t border-gray-primary/20" />
        <div className="mt-6 flex justify-end text-sm text-gray-primary/60">
          Today at 1:17 AM
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <div
            className="rounded p-1 text-gray-primary"
            data-tutorial="support-sample-message-options"
          >
            <DotsThree size={16} weight="bold" />
          </div>
          <div className="rounded-full bg-blue-light px-4 py-2 text-sm text-gray-primary">
            Tutorial message
          </div>
        </div>
        <div className="mt-2 flex justify-end text-sm text-gray-primary/60">
          Today at 1:17 AM
        </div>
      </div>

      <div className="border-t px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="rounded-full border border-gray-primary/30 p-1.5 text-gray-primary"
            data-tutorial="support-sample-attachments"
          >
            <Plus size={14} />
          </div>
          <div className="flex-1 rounded-full border border-gray-primary/30 px-4 py-2 text-sm text-gray-primary/70">
            Type your message here...
          </div>
          <div className="px-1 text-lg text-gray-primary">{">"}</div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component to pass active channel ID to ChannelPreview
function ChannelPreviewWrapper(props: Parameters<typeof ChannelPreview>[0]) {
  const { channel: activeChannel } = useChatContext();
  const isActive = activeChannel?.id === props.channel.id;

  return <ChannelPreview {...props} isActive={isActive} />;
}

export interface SupportScreenProps {
  activeTab: "Unresolved" | "Resolved";
  setActiveTab: (tab: "Unresolved" | "Resolved") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  streamUserId: string;
}

export default function SupportScreen({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  streamUserId,
}: SupportScreenProps) {
  const { client, setActiveChannel, channel: activeChannel } = useChatContext();
  const [isSupportTutorialActive, setIsSupportTutorialActive] = useState(false);
  const [hasSupportTutorialEnded, setHasSupportTutorialEnded] = useState(false);
  const [activeTutorialStep, setActiveTutorialStep] = useState<number | null>(
    null
  );
  const hasSupportTutorialEndedRef = useRef(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const channelIdFromQuery = searchParams.get("channel-id");

  const clearLegacyBellHighlight = useCallback(() => {
    document.body.classList.remove(LEGACY_BELL_HIGHLIGHT_CLASS);
  }, []);

  const removeSupportTutorialArtifacts = useCallback(() => {
    const supportLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href="/support"]')
    );

    supportLinks.forEach((link) => {
      if (link.getAttribute("data-tutorial") === SUPPORT_UNREAD_TAB_TUTORIAL_ID) {
        link.removeAttribute("data-tutorial");
      }

      link
        .querySelectorAll("[data-support-tutorial-badge='true']")
        .forEach((node) => node.remove());
      link
        .querySelectorAll("[data-tutorial='support-unread-notifications-badge']")
        .forEach((node) => node.removeAttribute("data-tutorial"));
    });
  }, []);

  useEffect(() => {
    if (channelIdFromQuery) return;
    router.replace(`${pathname}?activeTab=${activeTab}`);
  }, [activeTab, channelIdFromQuery, pathname, router]);

  useEffect(() => {
    if (!client || !channelIdFromQuery) return;
    if (activeChannel?.id === channelIdFromQuery) return;

    const setChannelFromQuery = async () => {
      try {
        const channel = client.channel("ticket", channelIdFromQuery);
        await channel.watch();

        setActiveChannel(channel);

        const isClosed = (channel.data as ExtraChannelData)?.closed === true;
        router.replace(pathname);
        setActiveTab(isClosed ? "Resolved" : "Unresolved");
      } catch (error) {
        console.error("Failed to set channel from query parameter: ", error);
      }
    };

    setChannelFromQuery();
  }, [
    client,
    channelIdFromQuery,
    activeChannel,
    setActiveChannel,
    setActiveTab,
    router,
    pathname,
  ]);

  useEffect(() => {
    if (!activeChannel) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChannelUpdate = (event: any) => {
      console.log("Channel updated event:", event);

      const channelData = event.channel?.data || activeChannel.data;
      if (channelData?.closed === true && activeTab === "Unresolved") {
        console.log("Switching to Resolved tab");
        setActiveTab("Resolved");
      }
    };

    activeChannel.on("channel.updated", handleChannelUpdate);

    return () => {
      activeChannel.off("channel.updated", handleChannelUpdate);
    };
  }, [activeChannel, setActiveTab, activeTab]);

  const handleTutorialStepChange = useCallback(
    (stepIndex: number) => {
      if (hasSupportTutorialEndedRef.current || hasSupportTutorialEnded) {
        return;
      }
      setIsSupportTutorialActive(true);
      setActiveTutorialStep(stepIndex);
      clearLegacyBellHighlight();
    },
    [clearLegacyBellHighlight, hasSupportTutorialEnded]
  );

  const handleTutorialEnd = useCallback(() => {
    hasSupportTutorialEndedRef.current = true;
    setHasSupportTutorialEnded(true);
    setIsSupportTutorialActive(false);
    setActiveTutorialStep(null);
    removeSupportTutorialArtifacts();
    clearLegacyBellHighlight();
  }, [clearLegacyBellHighlight, removeSupportTutorialArtifacts]);

  useEffect(() => {
    if (!hasSupportTutorialEnded) {
      return;
    }

    setIsSupportTutorialActive(false);
    setActiveTutorialStep(null);
    removeSupportTutorialArtifacts();
  }, [hasSupportTutorialEnded, removeSupportTutorialArtifacts]);

  useEffect(() => {
    if (!isSupportTutorialActive || hasSupportTutorialEnded) {
      return;
    }

    let pendingCleanupTimeout: number | null = null;

    const maybeScheduleCleanup = () => {
      const hasTooltip = Boolean(
        document.querySelector(TUTORIAL_TOOLTIP_SELECTOR)
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

        if (!document.querySelector(TUTORIAL_TOOLTIP_SELECTOR)) {
          hasSupportTutorialEndedRef.current = true;
          setHasSupportTutorialEnded(true);
          setIsSupportTutorialActive(false);
          setActiveTutorialStep(null);
          removeSupportTutorialArtifacts();
          clearLegacyBellHighlight();
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
    clearLegacyBellHighlight,
    hasSupportTutorialEnded,
    isSupportTutorialActive,
    removeSupportTutorialArtifacts,
  ]);

  useEffect(() => {
    const supportLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href="/support"]')
    );
    if (supportLinks.length === 0) return;

    const isVisible = (element: HTMLElement) => {
      const styles = window.getComputedStyle(element);
      return (
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        element.getClientRects().length > 0
      );
    };

    const visibleSupportLink = supportLinks.find((link) => isVisible(link));
    const shouldShowSampleUnreadBadge =
      isSupportTutorialActive &&
      activeTutorialStep === SUPPORT_UNREAD_NOTIFICATIONS_STEP_INDEX;

    supportLinks.forEach((link) => {
      const shouldTargetThisLink =
        isSupportTutorialActive && link === visibleSupportLink;
      const tutorialBadge = link.querySelector<HTMLElement>(
        "[data-support-tutorial-badge='true']"
      );
      const hasRealUnreadBadge = Array.from(
        link.querySelectorAll<HTMLElement>("span")
      ).some(
        (span) =>
          span.dataset.supportTutorialBadge !== "true" &&
          span.classList.contains("bg-red-primary")
      );

      if (shouldTargetThisLink) {
        link.setAttribute("data-tutorial", SUPPORT_UNREAD_TAB_TUTORIAL_ID);
      } else if (
        link.getAttribute("data-tutorial") === SUPPORT_UNREAD_TAB_TUTORIAL_ID
      ) {
        link.removeAttribute("data-tutorial");
      }

      if (shouldShowSampleUnreadBadge && shouldTargetThisLink) {
        if (!hasRealUnreadBadge && !tutorialBadge) {
          const sampleBadge = document.createElement("span");
          sampleBadge.dataset.supportTutorialBadge = "true";
          sampleBadge.className =
            "ml-auto rounded-full bg-red-primary px-2 py-0.5 text-xs text-white sm:hidden md:flex";
          sampleBadge.textContent = "1";
          link.appendChild(sampleBadge);
        }
      } else {
        tutorialBadge?.remove();
      }

      // Clean up any old badge-target behavior from previous implementations.
      link
        .querySelectorAll("[data-support-tutorial-badge='true']")
        .forEach((node) => {
          if (!shouldShowSampleUnreadBadge || !shouldTargetThisLink) {
            node.remove();
          }
        });
      link
        .querySelectorAll("[data-tutorial='support-unread-notifications-badge']")
        .forEach((node) => node.removeAttribute("data-tutorial"));
    });

    return () => {
      supportLinks.forEach((link) => {
        if (link.getAttribute("data-tutorial") === SUPPORT_UNREAD_TAB_TUTORIAL_ID) {
          link.removeAttribute("data-tutorial");
        }

        link
          .querySelectorAll("[data-support-tutorial-badge='true']")
          .forEach((node) => node.remove());
        link
          .querySelectorAll("[data-tutorial='support-unread-notifications-badge']")
          .forEach((node) => node.removeAttribute("data-tutorial"));
      });
    };
  }, [activeTutorialStep, isSupportTutorialActive]);

  useEffect(() => {
    if (
      !isSupportTutorialActive ||
      activeTutorialStep !== SUPPORT_UNREAD_NOTIFICATIONS_STEP_INDEX
    ) {
      return;
    }

    const triggerResize = () => {
      window.dispatchEvent(new Event("resize"));
    };

    const rafId = window.requestAnimationFrame(() => {
      triggerResize();
      window.requestAnimationFrame(triggerResize);
    });

    const timeoutId = window.setTimeout(triggerResize, 120);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [activeTutorialStep, isSupportTutorialActive]);

  useEffect(() => {
    const supportLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href="/support"]')
    );
    return () => {
      supportLinks.forEach((link) => {
        if (link.getAttribute("data-tutorial") === SUPPORT_UNREAD_TAB_TUTORIAL_ID) {
          link.removeAttribute("data-tutorial");
        }
        link
          .querySelectorAll("[data-support-tutorial-badge='true']")
          .forEach((node) => node.remove());
      });
    };
  }, []);

  useEffect(() => {
    clearLegacyBellHighlight();
    return () => {
      removeSupportTutorialArtifacts();
      clearLegacyBellHighlight();
    };
  }, [clearLegacyBellHighlight, removeSupportTutorialArtifacts]);

  const handleTicketCreated = useCallback(
    async (channelId: string) => {
      if (!client) return;

      try {
        const channel = client.channel("ticket", channelId);
        await channel.watch();

        setActiveChannel(channel);

        setActiveTab("Unresolved");
      } catch (error) {
        console.error("Failed to set active channel:", error);
      }
    },
    [client, setActiveChannel, setActiveTab]
  );

  const filters: Record<string, unknown> = {
    type: "ticket",
    members: {
      $in: [streamUserId],
    },
  };

  if (activeTab === "Unresolved") {
    filters.closed = { $eq: false };
  } else {
    filters.closed = { $eq: true };
  }

  if (searchQuery.trim()) {
    filters.name = { $autocomplete: searchQuery };
  }

  const channelRenderFilterFn = (channels: ChannelType[]) => {
    return channels.filter((channel) => {
      const channelData = channel.data as ExtraChannelData;
      if (activeTab === "Unresolved") {
        return channelData?.closed !== true;
      } else {
        return channelData?.closed === true;
      }
    });
  };

  return (
    <>
      <div
        className="str-chat__channel-list-wrapper flex flex-col h-full"
        data-tutorial="support-left-ticket-panel"
      >
        <Tutorial
          tutorialSteps={SUPPORT_TUTORIAL_STEPS}
          type="adminSupport"
          onStepChange={handleTutorialStepChange}
          onTutorialEnd={handleTutorialEnd}
        />
        <div className="pr-4 pt-4 pb-2 flex-shrink-0 border-b border-gray-primary/10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-primary">
              Tickets
            </h1>
            <CreateTicketModal onTicketCreated={handleTicketCreated} />
          </div>
          <ChannelListTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <TicketSearchBar onSearchChange={setSearchQuery} />
        </div>
        <div className="relative flex-1 overflow-y-auto">
          {isSupportTutorialActive && <TutorialSampleTicketRow />}
          <ChannelList
            filters={filters}
            channelRenderFilterFn={channelRenderFilterFn}
            sort={[
              {
                last_message_at: -1,
              },
            ]}
            Preview={ChannelPreviewWrapper}
            Paginator={InfiniteScroll}
            EmptyStateIndicator={() =>
              isSupportTutorialActive ? null : (
                <div className="w-full flex flex-col justify-center gap-2 my-8">
                  <ChatCircleSlash
                    size={48}
                    className="mx-auto text-gray-primary/40"
                  />
                  <p className="text-center">No tickets found.</p>
                </div>
              )
            }
          />
        </div>
      </div>
      <Channel>
        <Window>
          <TicketChannelHeader />
          <MessageList />
          <TicketMessageInput />
          {isSupportTutorialActive && <TutorialSampleConversation />}
        </Window>
        <Thread />
      </Channel>
    </>
  );
}
