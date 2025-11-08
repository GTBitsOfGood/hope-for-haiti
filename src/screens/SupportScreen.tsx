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
  Window,
} from "stream-chat-react";

export default function SupportScreen() {
  const session = useSession();
  const client = useChat();

  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  if (!client) {
    return <div>Loading chat...</div>;
  }

  return (
    <Chat client={client}>
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
      </Channel>
    </Chat>
  );
}
