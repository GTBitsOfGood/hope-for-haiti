import useChat from "@/hooks/useChat";
import { Chat } from "stream-chat-react";

export default function SupportScreen() {
  const client = useChat();

  if (!client) {
    return <div>Loading chat...</div>;
  }

  return (
    <Chat client={client}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Support</h1>
        <p>
          Welcome to the Support Page. Here you can find help and resources.
        </p>
      </div>
    </Chat>
  );
}
