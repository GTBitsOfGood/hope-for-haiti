import { ExtraChannelData } from "@/types/api/streamio.types";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  MessageInput,
  useChannelStateContext,
  useMessageComposer,
} from "stream-chat-react";
import TicketInput from "./TicketInput";
import { useSession } from "next-auth/react";
import { hasPermission, isPartner } from "@/lib/userUtils";

export default function TicketMessageInput() {
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();
  const { data: session } = useSession();

  const data = channel.data as ExtraChannelData;
  // Partners can always write messages, staff needs supportWrite permission
  const canWrite = session?.user
    ? (isPartner(session.user.type) || hasPermission(session.user, "supportWrite"))
    : false;

  useEffect(() => {
    // Disable message input if the ticket is closed or user lacks permission
    const disabled = data.closed || !canWrite;
    composer.config.text.enabled = !disabled;
    composer.config.drafts.enabled = !disabled;
    composer.config.location.enabled = !disabled;
    composer.config.attachments.maxNumberOfFilesPerMessage = disabled
      ? 0 // Will disable attachments
      : 10; // Default is 10
  }, [data.closed, canWrite, composer.config]);

  return (
    <MessageInput
      overrideSubmitHandler={
        data.closed || !canWrite
          ? () => {
              if (data.closed) {
                toast("Cannot send a message to a closed ticket.");
              } else {
                toast("You don't have permission to write messages.");
              }
            }
          : undefined
      }
      Input={(props) => <TicketInput {...props} canWrite={canWrite} />}
    />
  );
}
