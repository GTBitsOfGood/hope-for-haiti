import CreateTicketModal from "@/components/CreateTicketModal";
import useChat from "@/hooks/useChat";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import "@/app/support/support.css";

export default function SupportScreen() {
  const session = useSession();
  const client = useChat();

  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  if (!client) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
      />
      <button
        onClick={() => setIsCreateTicketModalOpen(true)}
        className="m-4 p-2 bg-blue-primary text-white rounded"
      >
        Create Ticket
      </button>
      <div className="flex h-full flex-grow">
        <Chat client={client}>
          <ChannelList
            filters={{
              members: {
                $in: [session.data!.user.streamUserId!],
              },
            }}
          />
          <Channel>
            <Window>
              <ChannelHeader />
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
