import { useMemo, useRef, useState } from "react";
import { useChannelStateContext } from "stream-chat-react";
import { Paperclip, FileText } from "@phosphor-icons/react";
import Portal from "../baseTable/Portal";

export default function TicketAttachmentsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { messages } = useChannelStateContext();

  const attachments = useMemo(() => {
    return (messages ?? [])
      .filter((message) => !message.deleted_at)
      .flatMap((message) => message.attachments ?? [])
      .filter((attachment) => attachment.image_url || attachment.asset_url);
  }, [messages]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-sunken hover:shadow-md transition-all duration-150 text-sm"
      >
        <Paperclip size={18} />
        Attachments
      </button>
      <Portal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={buttonRef}
        position="bottom-left"
        className="w-72 max-h-96 overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 p-2"
      >
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-primary/70 px-2 py-3">
            No attachments yet.
          </p>
        ) : (
          attachments.map((attachment, i) => (
            <a
              key={i}
              href={attachment.asset_url ?? attachment.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100"
            >
              {attachment.image_url || attachment.thumb_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.thumb_url ?? attachment.image_url}
                  alt={attachment.title ?? "attachment"}
                  className="w-8 h-8 object-cover rounded shrink-0"
                />
              ) : (
                <FileText size={20} className="shrink-0" />
              )}
              <span className="text-sm truncate">
                {attachment.title ?? "Untitled file"}
              </span>
            </a>
          ))
        )}
      </Portal>
    </div>
  );
}
