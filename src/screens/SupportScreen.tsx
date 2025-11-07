import useChat from "@/hooks/useChat";
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
  const client = useChat();

  if (!client) {
    return <div>Loading chat...</div>;
  }

  return (
    <Chat client={client}>
      <ChannelList />
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
