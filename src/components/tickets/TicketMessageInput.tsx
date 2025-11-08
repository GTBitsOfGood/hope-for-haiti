import { ExtraChannelData } from "@/types/api/streamio.types";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  MessageInput,
  useChannelStateContext,
  useMessageComposer,
} from "stream-chat-react";

export default function TicketMessageInput() {
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();

  const data = channel.data as ExtraChannelData;

  useEffect(() => {
    // Disable message input if the ticket is closed
    composer.config.text.enabled = !data.closed;
    composer.config.drafts.enabled = !data.closed;
    composer.config.location.enabled = !data.closed;
    composer.config.attachments.maxNumberOfFilesPerMessage = data.closed
      ? 0 // Will disable attachments
      : 10; // Default is 10
  }, [data.closed, composer.config]);

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
