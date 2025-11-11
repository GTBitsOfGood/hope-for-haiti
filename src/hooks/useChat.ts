import { useCreateChatClient } from "stream-chat-react";
import { useUser } from "../components/context/UserContext";

/**
 * Make sure this hook is only called once in a component tree!
 */
export default function useChat() {
  const user = useUser().user!;

  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAMIO_API_KEY!,
    tokenOrProvider: user?.streamUserToken,
    userData: {
      id: user.streamUserId!,
      name: user.name ?? undefined,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name ?? "User"
      )}&background=f6f7ff&color=ef3340&size=128`,
    },
  });

  return client;
}
