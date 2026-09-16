import { useEffect, useMemo, useRef, useState } from "react";
import { useChannelStateContext } from "stream-chat-react";
import type { LocalMessage } from "stream-chat";
import { Paperclip, FileText } from "@phosphor-icons/react";
import Portal from "../baseTable/Portal";

const MAX_HISTORY_PAGES = 20;
const HISTORY_PAGE_SIZE = 100;

export default function TicketAttachmentsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { channel } = useChannelStateContext();
  const [messages, setMessages] = useState<LocalMessage[]>(
    () => channel.state.messages
  );
  const backfilledChannelsRef = useRef(new Set<string>());

  useEffect(() => {
    setMessages([...channel.state.messages]);

    const refresh = () => setMessages([...channel.state.messages]);
    channel.on("message.new", refresh);
    channel.on("message.updated", refresh);
    channel.on("message.deleted", refresh);

    let cancelled = false;

    const backfillHistory = async () => {
      const cid = channel.cid;
      if (backfilledChannelsRef.current.has(cid)) return;

      for (let page = 0; page < MAX_HISTORY_PAGES; page++) {
        if (cancelled) return;
        if (!channel.state.messagePagination.hasPrev) break;

        const oldestId = channel.state.messages[0]?.id;
        try {
          await channel.query({
            messages: {
              limit: HISTORY_PAGE_SIZE,
              ...(oldestId ? { id_lt: oldestId } : {}),
            },
          });
        } catch (error) {
          console.error("Failed to backfill ticket message history:", error);
          break;
        }

        if (cancelled) return;
        setMessages([...channel.state.messages]);
      }

      if (!cancelled) backfilledChannelsRef.current.add(cid);
    };

    backfillHistory();

    return () => {
      cancelled = true;
      channel.off("message.new", refresh);
      channel.off("message.updated", refresh);
      channel.off("message.deleted", refresh);
    };
  }, [channel]);

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
