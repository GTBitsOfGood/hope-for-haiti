"use client";

import { useEffect, useCallback } from "react";
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
import { ChatCircleSlash } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExtraChannelData } from "@/types/api/streamio.types";

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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const channelIdFromQuery = searchParams.get("channel-id");

  useEffect(() => {
    if (channelIdFromQuery) return;
    router.replace(`${pathname}?activeTab=${activeTab}`)
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
  }, [client, channelIdFromQuery, activeChannel, setActiveChannel, setActiveTab, router, pathname]);

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
      <div className="str-chat__channel-list-wrapper flex flex-col h-full">
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
        <div className="flex-1 overflow-y-auto">
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
            EmptyStateIndicator={() => (
              <div className="w-full flex flex-col justify-center gap-2 my-8">
                <ChatCircleSlash size={48} className="mx-auto text-gray-primary/40" />
                <p className="text-center">No tickets found.</p>
              </div>
            )}
          />
        </div>
      </div>
      <Channel>
        <Window>
          <TicketChannelHeader />
          <MessageList />
          <TicketMessageInput />
        </Window>
        <Thread />
      </Channel>
    </>
  );
}
