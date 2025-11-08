import { ExtraChannelData } from "@/types/api/streamio.types";
import toast from "react-hot-toast";
import { MessageInput, useChannelStateContext } from "stream-chat-react";

export default function TicketMessageInput() {
  const { channel } = useChannelStateContext();
  const data = channel.data as ExtraChannelData;

  return (
    <MessageInput
      overrideSubmitHandler={
        data.closed
          ? () => {
              toast("Cannot send a message to a closed ticket.");
            }
          : undefined
      }
    />
  );
}
