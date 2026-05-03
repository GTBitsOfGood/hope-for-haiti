import { ExtraChannelData } from "@/types/api/streamio.types";
import {
  WithDragAndDropUpload,
  QuotedMessagePreview,
  TextareaComposer,
  SendButton,
  useMessageInputContext,
  AttachmentPreviewList,
  SimpleAttachmentSelector,
  useChannelStateContext,
} from "stream-chat-react";

interface TicketInputProps {
  canWrite: boolean;
}

export default function TicketInput({ canWrite }: TicketInputProps) {
  const { handleSubmit } = useMessageInputContext();
  const { channel } = useChannelStateContext();

  const isClosed = (channel.data as ExtraChannelData).closed;
  const isDisabled = isClosed || !canWrite;

  const getPlaceholder = () => {
    if (isClosed) {
      return "Ticket is closed. You cannot send messages.";
    }
    if (!canWrite) {
      return "You don't have permission to send messages.";
    }
    return "Type your message here...";
  };

  return (
    <WithDragAndDropUpload className="px-2 w-full flex items-center gap-2">
      <QuotedMessagePreview />
      <AttachmentPreviewList />
      {/* cursor-pointer is being weird and only working over the padding */}
      <div
        className={`hover:bg-sunken hover:shadow-md cursor-pointer *:cursor-pointer rounded-full p-2 transition
          ${isDisabled ? "opacity-50 pointer-events-none *:pointer-events-none" : ""}`}
        data-tutorial="support-attachments"
      >
        <SimpleAttachmentSelector />
      </div>
      <TextareaComposer
        containerClassName={`flex-1 min-w-0 *:w-full *:rounded-full *:resize-none flex items-center ${
          isDisabled && "*:bg-gray-primary/15 *:cursor-not-allowed"
        }`}
        placeholder={getPlaceholder()}
      />
      <SendButton
        sendMessage={handleSubmit}
        disabled={isDisabled}
        className="cursor-pointer hover:bg-sunken hover:shadow-md p-2 rounded-full transition
          disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
      />
    </WithDragAndDropUpload>
  );
}
