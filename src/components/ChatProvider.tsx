"use client";

import { Chat, useCreateChatClient } from "stream-chat-react";
import { useUser } from "./context/UserContext";

export default function ChatProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useUser().user!;

  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAMIO_API_KEY!,
    tokenOrProvider: user?.streamUserToken,
    userData: {
      id: user.streamUserId!,
      name: user.name ?? undefined,
    },
  });

  if (client === null) {
    return <>{children}</>;
  }

  return <Chat client={client}>{children}</Chat>;
}
