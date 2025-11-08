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

export default function TicketInput() {
  const { handleSubmit } = useMessageInputContext();
  const { channel } = useChannelStateContext();

  const isClosed = (channel.data as ExtraChannelData).closed;

  return (
    <WithDragAndDropUpload className="px-2 w-full flex items-center justify-between gap-2">
      <QuotedMessagePreview />
      <AttachmentPreviewList />
      {/* cursor-pointer is being weird and only working over the padding */}
      <div
        className={`hover:bg-sunken hover:shadow-md cursor-pointer *:cursor-pointer rounded-full p-2 transition
          ${isClosed ? "opacity-50 pointer-events-none *:pointer-events-none" : ""}`}
      >
        <SimpleAttachmentSelector />
      </div>
      <TextareaComposer
        containerClassName={`grow *:w-full *:rounded-full *:resize-none flex items-center ${
          isClosed && "*:bg-gray-primary/15 *:cursor-not-allowed"
        }`}
      />
      <SendButton
        sendMessage={handleSubmit}
        disabled={isClosed}
        className="cursor-pointer hover:bg-sunken hover:shadow-md p-2 rounded-full transition 
          disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
      />
    </WithDragAndDropUpload>
  );
}
