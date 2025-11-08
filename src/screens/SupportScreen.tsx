import useChat from "@/hooks/useChat";
import { useSession } from "next-auth/react";
import {
  Channel,
  ChannelList,
  Chat,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import ChannelPreview from "@/components/tickets/ChannelPreview";
import TicketChannelHeader from "@/components/tickets/TicketChannelHeader";
import TicketMessageInput from "@/components/tickets/TicketMessageInput";

import "@/app/support/support.css";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { ChatCircleSlash } from "@phosphor-icons/react";

export default function SupportScreen() {
  const session = useSession();
  const client = useChat();

  if (!client) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-full flex-grow">
        <Chat client={client}>
          <ChannelList
            filters={{
              members: {
                $in: [session.data!.user.streamUserId!],
              },
            }}
            sort={[
              {
                closed: 1,
              },
              {
                last_message_at: -1,
              },
            ]}
            Preview={ChannelPreview}
            showChannelSearch
            additionalChannelSearchProps={{
              searchForChannels: true,
              searchForUsers: false,
            }}
            EmptyStateIndicator={() => (
              <div className="w-full flex flex-col justify-center gap-2 my-8">
                <ChatCircleSlash size={48} className="mx-auto text-gray-400" />
                <p className="text-center">No tickets found.</p>
                <CreateTicketModal />
              </div>
            )}
          />
          <Channel>
            <Window>
              <TicketChannelHeader />
              <MessageList />
              <TicketMessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}
