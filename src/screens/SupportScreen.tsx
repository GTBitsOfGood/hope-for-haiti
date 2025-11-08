import useChat from "@/hooks/useChat";
import { useSession } from "next-auth/react";
import {
  Channel,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import "@/app/support/support.css";
import ChannelPreview from "@/components/tickets/ChannelPreview";
import TicketChannelHeader from "@/components/tickets/TicketChannelHeader";

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
          />
          <Channel>
            <Window>
              <TicketChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}
